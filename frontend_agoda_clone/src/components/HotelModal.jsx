import React from "react";

export default function HotelModal({ hotel, onClose }) {
  if (!hotel) return null;

  const googleSearchLink = `https://www.google.com/search?q=${encodeURIComponent(
    `${hotel.ten} ${hotel.dia_chi}`
  )}`;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-lg p-6 w-[90%] max-w-4xl flex flex-col md:flex-row gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hình ảnh */}
        <div className="md:w-1/2 w-full">
          <img
            src={hotel.hinh_anh || "https://via.placeholder.com/500x300"}
            alt={hotel.ten}
            className="w-full h-64 object-cover rounded-xl"
          />
        </div>

        {/* Nội dung */}
        <div className="md:w-1/2 w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{hotel.ten}</h2>
          <p className="text-gray-600 mb-1">{hotel.dia_chi}</p>
          <p className="text-yellow-600 mb-2">
            ⭐ {hotel.diem_danh_gia} ({hotel.so_luong_danh_gia} đánh giá)
          </p>
          <p className="text-green-700 font-bold text-lg mb-4">
            {hotel.gia_sau.toLocaleString()}₫ / đêm
          </p>

          {/* Tiện nghi */}
          <div>
            <h3 className="font-semibold mb-1">Tiện nghi nổi bật:</h3>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
              {hotel.bep && <li>Bếp</li>}
              {hotel.bua_sang && <li>Bữa sáng</li>}
              {hotel.san_gon && <li>Sân gôn</li>}
              {hotel.may_giat && <li>Máy giặt</li>}
              {hotel.don_phong_hang_ngay && <li>Dọn phòng hằng ngày</li>}
              {hotel.dua_don_san_bay && <li>Đưa đón sân bay</li>}
              {hotel.phong_tap && <li>Phòng tập</li>}
              {hotel.thu_nuoi && <li>Cho phép thú nuôi</li>}
              {hotel.bai_do_xe && <li>Bãi đỗ xe</li>}
            </ul>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Đóng
            </button>
            <a
              href={googleSearchLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
            >
              Đặt ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
