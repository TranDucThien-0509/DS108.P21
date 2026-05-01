import React, { useState } from "react";
import { fetchOptimalHotels } from "../api";

export default function OptimalHotelPlanner({ likeStatus, locations = [], setSelectedHotel, hotels = [] }) {
  const [schedule, setSchedule] = useState([{ ngay: "", dia_diem: "" }]);
  const [budget, setBudget] = useState(1000000);
  const [amenities, setAmenities] = useState({
    bep: false,
    bua_sang: false,
    san_gon: false,
    may_giat: false,
    phong_tap: false,
    dua_don_san_bay: false,
    don_phong_hang_ngay: false,
    thu_nuoi: false,
    bai_do_xe: false,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (index, field, value) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const addRow = () => {
    setSchedule([...schedule, { ngay: "", dia_diem: "" }]);
  };

  const removeRow = (index) => {
    if (schedule.length > 1) {
      setSchedule(schedule.filter((_, i) => i !== index));
    }
  };

  const handleAmenityChange = (name) => {
    setAmenities((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const yeuThich = Object.entries(likeStatus)
        .filter(([_, val]) => val === "like")
        .map(([key]) => key);
      const khongThich = Object.entries(likeStatus)
        .filter(([_, val]) => val === "dislike")
        .map(([key]) => key);

      const filters = Object.fromEntries(
        Object.entries(amenities).map(([key, value]) => [key, value])
      );

      const res = await fetchOptimalHotels({
        ngan_sach: budget,
        lich_trinh: schedule,
        yeu_thich: yeuThich,
        khong_thich: khongThich,
        filters: filters,
      });
      setResult(res);
    } catch (e) {
      setError("Có lỗi xảy ra khi gọi API. Vui lòng thử lại.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleHotelClick = (hotelFromResult) => {
    const fullHotelInfo = hotels.find((h) => h.ten === hotelFromResult.ten);
    if (fullHotelInfo) {
      const mergedHotelInfo = {
        ...fullHotelInfo,
        ngay: hotelFromResult.ngay,
        dia_diem: hotelFromResult.dia_diem,
        gia_sau: hotelFromResult.gia_sau,
        gia_tri_thuc: hotelFromResult.gia_tri_thuc,
      };
      setSelectedHotel(mergedHotelInfo);
    } else {
      setSelectedHotel(hotelFromResult);
    }
  };

  const amenityLabels = {
    bep: "Bếp",
    bua_sang: "Bữa sáng",
    san_gon: "Sân gôn",
    may_giat: "Máy giặt",
    phong_tap: "Phòng tập",
    dua_don_san_bay: "Đưa đón sân bay",
    don_phong_hang_ngay: "Dọn phòng hàng ngày",
    thu_nuoi: "Thú nuôi",
    bai_do_xe: "Bãi đỗ xe",
  };

  return (
    <div className="my-8 p-4 bg-white rounded-2xl shadow-md">
      <div className="mb-4">
        <label className="block text-sm font-medium text-black mb-1">Ngân sách tối đa (VND)</label>
        <input
          type="number"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black w-full"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-black mb-1">Tiện nghi</label>
        <div className="flex flex-wrap gap-2 max-w-xs">
          {Object.entries(amenities).map(([name, checked]) => (
            <label key={name} className="flex items-center space-x-1 text-sm text-black">
              <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={() => handleAmenityChange(name)}
                className="accent-blue-600"
              />
              <span>{amenityLabels[name]}</span>
            </label>
          ))}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-black mb-2">Lịch trình</h3>
      {schedule.map((row, i) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <div className="flex-1">
            <label className="block text-sm mb-1">Ngày</label>
            <input
              type="date"
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black w-full"
              value={row.ngay}
              onChange={(e) => handleChange(i, "ngay", e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Địa điểm</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black w-full"
              value={row.dia_diem}
              onChange={(e) => handleChange(i, "dia_diem", e.target.value)}
            >
              <option value="">Chọn địa điểm</option>
              {locations.length > 0 ? (
                locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Đang tải địa điểm...
                </option>
              )}
            </select>
          </div>
          {schedule.length > 1 && (
            <button
              onClick={() => removeRow(i)}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Xóa
            </button>
          )}
        </div>
      ))}
      <div className="flex justify-between mt-4">
        <button
          onClick={addRow}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          ➕ Thêm dòng
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          disabled={loading}
        >
          {loading ? "Đang xử lý..." : "🔍 Tìm tổ hợp tối ưu"}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">✅ Kết quả gợi ý:</h3>
          <p>Tổng chi phí: {result.tong_chi_phi.toLocaleString()} VND</p>
          <p>Tổng giá trị: {result.tong_gia_tri}</p>
          <ul className="mt-4 list-disc pl-6">
            {result.goi_y.map((hotel, idx) => (
              <li
                key={idx}
                onClick={() => handleHotelClick(hotel)}
                className="cursor-pointer hover:text-blue-500 mb-2"
              >
                <strong>
                  {hotel.ngay} - {hotel.dia_diem}
                </strong>
                : {hotel.ten} ({hotel.gia_sau.toLocaleString()}đ, điểm{" "}
                {hotel.gia_tri_thuc})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}