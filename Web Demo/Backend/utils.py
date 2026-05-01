# --- utils.py ---
import pandas as pd
import numpy as np
from datetime import date
from pydantic import BaseModel
from typing import List, Dict
from sklearn.linear_model import Ridge
from sklearn.preprocessing import MinMaxScaler, StandardScaler
from sklearn.cluster import KMeans
import pulp

class LichTrinhItem(BaseModel):
    ngay: date
    dia_diem: str

class OptimalHotelRequest(BaseModel):
    ngan_sach: int
    lich_trinh: List[LichTrinhItem]
    yeu_thich: List[str] = []
    khong_thich: List[str] = []
    filters: Dict[str, bool] = {}

class HotelOptimizer:
    def __init__(self, data_path):
        self.df = pd.read_csv(data_path)
        self.df.columns = self.df.columns.str.strip()
        self.df['ngay'] = pd.to_datetime(self.df['ngay'].astype(str) + '-2025', format='%d-%m-%Y', errors='coerce')
        self.df.dropna(subset=['ngay'], inplace=True)

        for col in ['bep', 'bua_sang', 'san_gon', 'may_giat', 'dua_don_san_bay',
                    'phong_tap', 'don_phong_hang_ngay', 'thu_nuoi', 'bai_do_xe', 'het_phong']:
            if col in self.df.columns:
                self.df[col] = self.df[col].astype(bool)
        self.df['id'] = range(1, len(self.df) + 1)

        self.features = [
            'bep', 'bua_sang', 'san_gon', 'may_giat', 'dua_don_san_bay',
            'phong_tap', 'don_phong_hang_ngay', 'thu_nuoi', 'bai_do_xe',
            'vi_tri', 'dich_vu', 'dang_gia_tien', 'co_so_vat_chat', 'do_sach_se'
        ]

        # Tiền xử lý toàn bộ dữ liệu
        self._precompute_scores()

    def _precompute_scores(self):
        df = self.df.copy()
        for f in self.features:
            if f not in df.columns:
                df[f] = 0  # Đảm bảo không thiếu cột

        X = df[self.features].fillna(0)

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.kmeans = KMeans(n_clusters=4, random_state=42)
        df['cluster'] = self.kmeans.fit_predict(X_scaled)

        df['target'] = 0
        df['cum_danh_gia'] = 'TRUNG_LAP'
        df['target_khuech_dai'] = 0

        self.ridge = Ridge(alpha=1.0)
        self.ridge.fit(X_scaled, df['target_khuech_dai'])

        df['gia_tri_thuc_ridge'] = self.ridge.predict(X_scaled)

        # Netflix score
        R = df['diem_danh_gia']
        v = df['so_luong_danh_gia']
        C = R.mean()
        m = v.quantile(0.75)
        df['gia_tri_thuc_netflix'] = ((v / (v + m)) * R + (m / (v + m)) * C)

        # Tổng hợp giá trị thực
        df['gia_tri_thuc'] = 0.5 * df['gia_tri_thuc_ridge'] + 0.5 * df['gia_tri_thuc_netflix']
        df['gia_tri_thuc'] = MinMaxScaler(feature_range=(0, 10)).fit_transform(df[['gia_tri_thuc']]).round(2)

        self.df = df

    def recommend(self, req: OptimalHotelRequest):
        ngays = [pd.to_datetime(item.ngay) for item in req.lich_trinh]
        places = [item.dia_diem.lower() for item in req.lich_trinh]

        # Lọc theo ngày và địa điểm
        hotels = self.df[
            self.df['ngay'].isin(ngays) & self.df['vi_tri_map'].str.lower().isin(places)
        ].drop_duplicates(subset=['id', 'ngay'])

        if hotels.empty:
            return {"tong_chi_phi": 0, "tong_gia_tri": 0, "goi_y": []}

        # Feature vector mở rộng theo yêu cầu mới
        features = [
            'bep', 'bua_sang', 'san_gon', 'may_giat', 'dua_don_san_bay',
            'phong_tap', 'don_phong_hang_ngay', 'thu_nuoi', 'bai_do_xe',
        ]
        for f in features:
            if f not in hotels.columns:
                hotels[f] = 0  # Bổ sung cột nếu thiếu

        # Chuẩn hóa đặc trưng
        X = hotels[features].fillna(0)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Gán nhãn sở thích
        hotels['target'] = 0
        hotels.loc[hotels['ten'].isin(req.yeu_thich), 'target'] = 1
        hotels.loc[hotels['ten'].isin(req.khong_thich), 'target'] = -1

        # Gom cụm
        kmeans = KMeans(n_clusters=4, random_state=42)
        hotels['cluster'] = kmeans.fit_predict(X_scaled)

        # Đánh giá cụm theo gu
        def danh_gia_cum(cum_df):
            if (cum_df['target'] == 1).sum() > (cum_df['target'] == -1).sum():
                return 'GẦN GU THÍCH'
            elif (cum_df['target'] == -1).sum() > (cum_df['target'] == 1).sum():
                return 'KHÔNG HỢP GU'
            else:
                return 'TRUNG_LẬP'

        hotels['cum_danh_gia'] = hotels.groupby('cluster')['target'].transform(lambda x: danh_gia_cum(hotels.loc[x.index]))

        # Khuếch đại
        hotels['target_khuech_dai'] = hotels['target']
        hotels.loc[hotels['cum_danh_gia'] == 'GẦN GU THÍCH', 'target_khuech_dai'] = 1
        hotels.loc[hotels['cum_danh_gia'] == 'KHÔNG HỢP GU', 'target_khuech_dai'] = -1

        # Ridge
        model = Ridge(alpha=1.0)
        model.fit(X_scaled, hotels['target_khuech_dai'])

        hotels['gia_tri_thuc_ridge'] = model.predict(X_scaled)

        scaler_ridge = MinMaxScaler(feature_range=(0, 10))
        hotels['gia_tri_thuc_ridge_scaled'] = scaler_ridge.fit_transform(hotels[['gia_tri_thuc_ridge']])

        # Chuẩn hóa và kết hợp Netflix score
        hotels['goi_y'] = np.tanh(hotels['gia_tri_thuc_ridge'])
        hotels['gia_tri_thuc'] = 0.5 * hotels['gia_tri_thuc_ridge'] + 0.5 * hotels['gia_tri_thuc_netflix']
        scaler_final = MinMaxScaler(feature_range=(0, 10))
        hotels['gia_tri_thuc'] = scaler_final.fit_transform(hotels[['gia_tri_thuc']]).round(2)

        # Lọc theo tiện nghi và các điều kiện hợp lệ
        if req.filters:
            selected_amenities = [k for k, v in req.filters.items() if v and k in hotels.columns]
            for amenity in selected_amenities:
                hotels = hotels[hotels[amenity] == True]

        # Lọc khách sạn có giá âm hoặc hết phòng
        hotels = hotels[(hotels['gia_sau'] > 0) & (~hotels['het_phong'])].reset_index(drop=True)
        if hotels.empty:
            return {"tong_chi_phi": 0, "tong_gia_tri": 0, "goi_y": []}

        # Tối ưu
        results = {}
        for mode in ['sum_value', 'value_per_cost', 'combined']:
            results[mode] = self._solve_optimization(hotels, ngays, req.ngan_sach, mode)

        best_result = max(results.values(), key=lambda x: x['tong_gia_tri'])
        return best_result

    def _solve_optimization(self, hotels, ngays, budget, mode):
        variables = [pulp.LpVariable(f"hotel_{i}", cat="Binary") for i in range(len(hotels))]
        model = pulp.LpProblem("Chon_Khach_San", pulp.LpMaximize)

        if mode == "sum_value":
            model += pulp.lpSum(variables[i] * hotels.loc[i, 'gia_tri_thuc'] for i in range(len(hotels)))
        elif mode == "value_per_cost":
            model += pulp.lpSum(variables[i] * (hotels.loc[i, 'gia_tri_thuc'] / hotels.loc[i, 'gia_sau'])
                                for i in range(len(hotels)))
        elif mode == "combined":
            model += pulp.lpSum(variables[i] * (
                0.7 * hotels.loc[i, 'gia_tri_thuc'] +
                0.3 * (hotels.loc[i, 'gia_tri_thuc'] / hotels.loc[i, 'gia_sau'])
            ) for i in range(len(hotels)))

        # Ngân sách
        model += pulp.lpSum(variables[i] * hotels.loc[i, 'gia_sau'] for i in range(len(hotels))) <= budget

        # Ràng buộc mỗi ngày đúng 1 khách sạn
        for ngay in sorted(set(ngays)):
            model += pulp.lpSum(
                variables[i] for i in range(len(hotels)) if hotels.loc[i, 'ngay'] == ngay
            ) == 1

        model.solve(pulp.PULP_CBC_CMD(msg=False))

        goi_y = []
        tong_gia_tri = 0
        tong_chi_phi = 0

        for i, var in enumerate(variables):
            if pulp.value(var) == 1:
                item = hotels.loc[i].to_dict()
                item['gia_tri_thuc'] = float(item['gia_tri_thuc'])
                item['gia_sau'] = float(item['gia_sau'])
                item['ngay'] = str(item['ngay'].date())
                goi_y.append(item)
                tong_gia_tri += item['gia_tri_thuc']
                tong_chi_phi += item['gia_sau']

        return {
            "tong_chi_phi": round(tong_chi_phi, 2),
            "tong_gia_tri": round(tong_gia_tri, 2),
            "goi_y": goi_y
        }