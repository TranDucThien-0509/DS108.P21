import pulp
import pandas as pd

# Đọc dữ liệu
df = pd.read_csv(r'C:\Users\Admin\Documents\Uni\DS108\Data\Gold Data\Gold_Data.csv')
df.columns = df.columns.str.strip()

# Đảm bảo chỉ xét các khách sạn còn phòng và có giá
df = df[(df['gia_sau'] > 0) & (df['het_phong'] == 0)].reset_index(drop=True)

# Lọc theo ngày yêu cầu
ngay_HCM = ['29-4', '30-4']
ngay_BMT = ['1-5']
df = df[((df['vi_tri_map'] == 'HCM') & (df['ngay'].isin(ngay_HCM))) |
        ((df['vi_tri_map'] == 'BMT') & (df['ngay'].isin(ngay_BMT)))].reset_index(drop=True)

# Tối ưu chọn khách sạn
top_n = 5
solutions = []

for k in range(top_n):
    # Biến quyết định
    vars = [pulp.LpVariable(f"hotel_{i}", cat="Binary") for i in range(len(df))]

    # Mô hình
    model = pulp.LpProblem(f"Top_{k+1}_Chon_khach_san", pulp.LpMaximize)
    model += pulp.lpSum(vars[i] * df.iloc[i]['gia_tri_thuc'] for i in range(len(df)))

    # Ràng buộc ngân sách
    ngan_sach = 1_000_000
    model += pulp.lpSum(vars[i] * df.iloc[i]['gia_sau'] for i in range(len(df))) <= ngan_sach

    # Ràng buộc mỗi ngày chỉ chọn 1 khách sạn
    for date in df['ngay'].unique():
        indices = df[df['ngay'] == date].index
        model += pulp.lpSum(vars[i] for i in indices) <= 1

    # Tránh chọn lại khách sạn đã có trong các giải pháp trước
    if solutions:
        # Lấy các khách sạn đã chọn trong các giải pháp trước
        chosen_hotels = [i for sol in solutions for i in sol]
        for i in chosen_hotels:
            model += vars[i] == 0  # Đảm bảo khách sạn không được chọn lại

    # Giải bài toán
    result = model.solve()
    if result != pulp.LpStatusOptimal:
        break

    # Lấy các khách sạn được chọn trong phương án này
    sol_indices = [i for i in range(len(df)) if vars[i].value() == 1]
    solutions.append(sol_indices)

    # In kết quả
    tong_gia = sum(df.iloc[i]['gia_sau'] for i in sol_indices)
    tong_giatri = sum(df.iloc[i]['gia_tri_thuc'] for i in sol_indices)

    print(f"\n🏅 PHƯƠNG ÁN #{k+1}")
    for i in sol_indices:
        row = df.iloc[i]
        print(f"- {row['ten']} | {row['vi_tri_map']} ({row['ngay']}) | Giá sau: {int(row['gia_sau'])} đ | Giá trị thực: {row['gia_tri_thuc']:.2f}")
    print(f"💰 Tổng chi phí: {tong_gia:,.0f} đ")
    print(f"⭐ Tổng giá trị thực: {tong_giatri:.2f}")
