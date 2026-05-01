import React from "react";

export default function HotelCard({ hotel, onToggleLike, likedStatus, onCardClick }) {
  const formattedDate = hotel.ngay
    ? new Date(hotel.ngay).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div
      className="flex bg-white rounded-2xl shadow-md hover:shadow-lg overflow-hidden transition duration-200 cursor-pointer p-4"
      onClick={() => onCardClick(hotel)}
    >
      {/* Nội dung chính */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Tên khách sạn và địa chỉ */}
          <h2 className="text-xl font-semibold text-gray-900">{hotel.ten}</h2>
          <p className="text-sm text-blue-600">{hotel.dia_chi}</p>

          {/* Ngày */}
          {formattedDate && (
            <p className="text-sm text-gray-600 mt-1">
              Ngày: {formattedDate}
            </p>
          )}

          {/* Tiện ích */}
          <div className="flex flex-wrap gap-2 mt-2">
            {hotel.tien_ich?.map((item, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-200 text-gray-700 rounded px-2 py-1 select-none"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          {/* Đánh giá */}
          <div className="text-sm text-yellow-600 font-semibold">
            ⭐ {hotel.diem_danh_gia} ({hotel.so_luong_danh_gia} đánh giá)
          </div>

          {/* Giá */}
          <div className="text-lg font-bold text-red-600">
            {hotel.gia_sau?.toLocaleString("vi-VN") || "0"}₫ / đêm
          </div>
        </div>

        {/* Hết phòng */}
        {hotel.het_phong && (
          <p className="text-sm text-red-600 mt-1 font-semibold">Đã hết phòng</p>
        )}

        {/* Nút Đặt ngay */}
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(hotel.ten + ' ' + hotel.dia_chi)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm w-fit"
          onClick={(e) => e.stopPropagation()}
        >
          Đặt ngay
        </a>
      </div>

      {/* Nút thích / không thích */}
      <div
        className="ml-4 self-start"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onToggleLike(hotel.ten)}
          className={`text-sm px-3 py-1 rounded-xl shadow-sm transition select-none ${
            likedStatus === "like"
              ? "bg-green-100 text-green-700"
              : likedStatus === "dislike"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {likedStatus === "like"
            ? "❤️ Thích"
            : likedStatus === "dislike"
            ? "👎 Không thích"
            : "🤍"}
        </button>
      </div>
    </div>
  );
}
