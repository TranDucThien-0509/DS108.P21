import React, { useEffect, useState, useMemo, useCallback } from "react";
import HotelCard from "./components/HotelCard";
import FilterBar from "./components/FilterBar";
import HotelModal from "./components/HotelModal";
import OptimalHotelPlanner from "./components/OptimalHotelPlanner";

const AMENITIES = [
  { name: "bep", label: "Bếp" },
  { name: "bua_sang", label: "Bữa sáng" },
  { name: "san_gon", label: "Sân gôn" },
  { name: "may_giat", label: "Máy giặt" },
  { name: "dua_don_san_bay", label: "Đưa đón sân bay" },
  { name: "phong_tap", label: "Phòng tập" },
  { name: "don_phong_hang_ngay", label: "Dọn phòng hàng ngày" },
  { name: "thu_nuoi", label: "Cho phép thú nuôi" },
  { name: "bai_do_xe", label: "Bãi đỗ xe" },
];

function App() {
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [filters, setFilters] = useState({
    location: "",
    date: "",
    minPrice: 0,
    maxPrice: 20000000,
    amenities: {},
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [personalizedHotels, setPersonalizedHotels] = useState([]);
  const [showPersonalized, setShowPersonalized] = useState(false);
  const [likeStatus, setLikeStatus] = useState({});
  const [visibleCount, setVisibleCount] = useState(6);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isLoadingHotels, setIsLoadingHotels] = useState(false);
  const [showOptimalPlanner, setShowOptimalPlanner] = useState(false);

  // Memoize locations để tránh tính toán lại không cần thiết
  const locations = useMemo(() => [...new Set(hotels.map((h) => h.vi_tri_map))], [hotels]);

  // Memoize likedHotels và dislikedHotels
  const likedHotels = useMemo(
    () =>
      Object.entries(likeStatus)
        .filter(([_, status]) => status === "like")
        .map(([name]) => name),
    [likeStatus]
  );
  const dislikedHotels = useMemo(
    () =>
      Object.entries(likeStatus)
        .filter(([_, status]) => status === "dislike")
        .map(([name]) => name),
    [likeStatus]
  );

  // Hàm fetch dữ liệu khách sạn
  const fetchHotelData = useCallback(async () => {
    setIsLoadingHotels(true);
    try {
      const response = await fetch("http://localhost:8000/hotels");
      const data = await response.json();
      const processedData = data
        .map((hotel) => {
          try {
            const date = new Date(hotel.ngay);
            if (isNaN(date.getTime())) throw new Error("Invalid date");
            return {
              ...hotel,
              ngay: `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`,
            };
          } catch (error) {
            console.warn("Invalid date for hotel:", hotel.ten, error);
            return null;
          }
        })
        .filter((hotel) => hotel !== null);
      setHotels(processedData);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      setHotels([]);
    } finally {
      setIsLoadingHotels(false);
    }
  }, []);

  useEffect(() => {
    fetchHotelData();
  }, [fetchHotelData]);

  // Hàm lọc dữ liệu
  const filterHotels = useCallback(() => {
    let data = [...hotels];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(
        (h) =>
          h.ten.toLowerCase().includes(query) ||
          h.dia_chi.toLowerCase().includes(query) ||
          h.vi_tri_map.toLowerCase().includes(query)
      );
    }
    if (filters.location) data = data.filter((h) => h.vi_tri_map === filters.location);
    if (filters.date) {
      const [year, month, day] = filters.date.split("-");
      const formattedFilterDate = `${month}/${day}/${year}`;
      data = data.filter((h) => h.ngay === formattedFilterDate);
    }
    if (filters.maxPrice) data = data.filter((h) => h.gia_sau <= Number(filters.maxPrice));
    if (filters.minPrice) data = data.filter((h) => h.gia_sau >= Number(filters.minPrice));
    Object.entries(filters.amenities).forEach(([key, val]) => {
      if (val) data = data.filter((h) => h[key]);
    });
    setFilteredHotels(data);
    setVisibleCount(6);
    setShowPersonalized(false);
  }, [filters, hotels, searchQuery]);

  useEffect(() => {
    filterHotels();
  }, [filterHotels]);

  // Hàm tải gợi ý cá nhân hóa
  const loadPersonalized = useCallback(async () => {
    const yeuThich = likedHotels;
    const khongThich = dislikedHotels;
    try {
      const response = await fetch("http://localhost:8000/personalized-hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yeu_thich: yeuThich,
          khong_thich: khongThich,
          ngay_start: filters.date || new Date().toISOString().split("T")[0],
          ngay_end: filters.date || new Date().toISOString().split("T")[0],
          dia_diem: filters.location || "",
        }),
      });
      const data = await response.json();
      if (data.status === "ok") {
        setPersonalizedHotels(data.result);
        setShowPersonalized(true);
        setVisibleCount(6);
      }
    } catch (error) {
      console.error("Error fetching personalized hotels:", error);
    }
  }, [likedHotels, dislikedHotels, filters.date, filters.location]);

  const dataToShow = showPersonalized ? personalizedHotels : filteredHotels;

  const handleToggleLike = useCallback((hotelName) => {
    setLikeStatus((prev) => {
      const current = prev[hotelName];
      const next = current === "like" ? "dislike" : current === "dislike" ? null : "like";
      return { ...prev, [hotelName]: next };
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 relative">
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #e5e7eb;
            border-radius: 12px;
            margin: 8px 0;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #2563eb;
            border-radius: 12px;
            transition: background 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #7c3aed;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #2563eb #e5e7eb;
          }
        `}
      </style>

      <button
        onClick={() => setShowFavorites(!showFavorites)}
        className="fixed top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg z-50"
      >
        ❤️ Yêu thích
      </button>

      <div
        className="relative rounded-2xl overflow-hidden mb-6 shadow"
        style={{
          backgroundImage: "url('https://www.pixelstalk.net/wp-content/uploads/2016/08/Travel-the-world-wallpaper-1920x1080.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 p-6 text-center text-white">
          <h1 className="text-3xl font-bold">Tìm khách sạn theo gu cá nhân</h1>
          <p className="text-sm mt-2">Lọc hoặc tìm kiếm theo vị trí, tiện nghi và cảm nhận cá nhân</p>
          <div className="mt-6">
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              locations={locations}
              amenities={AMENITIES}
            />
          </div>
          <div className="flex justify-between items-center mt-4 bg-white/70 p-2 rounded text-black">
            <button
              onClick={() => setShowOptimalPlanner(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Tối ưu hóa lựa chọn khách sạn
            </button>
            <button
              onClick={loadPersonalized}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mx-auto"
            >
              Gợi ý khách sạn theo gu
            </button>
            <p className="text-sm">🔍 {dataToShow.length} khách sạn được tìm thấy</p>
          </div>
        </div>
      </div>

      {showOptimalPlanner && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowOptimalPlanner(false)}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Tối ưu hóa lựa chọn khách sạn</h2>
            <div className="flex-1 overflow-y-auto">
              {hotels.length > 0 && locations.length > 0 ? (
                <OptimalHotelPlanner
                  likeStatus={likeStatus}
                  locations={locations}
                  setSelectedHotel={setSelectedHotel}
                  hotels={hotels}
                />
              ) : (
                <p className="text-gray-500">Đang tải dữ liệu...</p>
              )}
            </div>
            <button
              onClick={() => setShowOptimalPlanner(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {showFavorites && (
        <div className="fixed top-0 right-0 w-1/4 h-full bg-white shadow-lg p-4 overflow-y-auto z-50">
          <button
            onClick={() => setShowFavorites(false)}
            className="mb-4 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Đóng
          </button>
          <div>
            <h2 className="text-xl font-semibold mb-2 text-black">🥰 Danh sách yêu thích</h2>
            {likedHotels.length > 0 ? (
              <ul className="list-disc pl-5 text-black">
                {likedHotels.map((hotelName) => (
                  <li key={hotelName} className="flex justify-between items-center">
                    <span>{hotelName}</span>
                    <button
                      onClick={() => handleToggleLike(hotelName)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Chưa có khách sạn nào trong danh sách yêu thích.</p>
            )}
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2 text-black">😕 Danh sách không thích</h2>
            {dislikedHotels.length > 0 ? (
              <ul className="list-disc pl-5 text-black">
                {dislikedHotels.map((hotelName) => (
                  <li key={hotelName} className="flex justify-between items-center">
                    <span>{hotelName}</span>
                    <button
                      onClick={() => handleToggleLike(hotelName)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Xóa
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Chưa có khách sạn nào trong danh sách không thích.</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-6 p-4 bg-white shadow-md rounded-lg flex items-center gap-4">
          <input
            type="text"
            placeholder="Tìm tên khách sạn, địa chỉ hoặc vị trí..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() =>
              setFilteredHotels(
                [...hotels].filter(
                  (h) =>
                    h.ten.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    h.dia_chi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    h.vi_tri_map.toLowerCase().includes(searchQuery.toLowerCase())
                )
              )
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tìm kiếm
          </button>
        </div>

        {isLoadingHotels ? (
          <p className="text-center text-gray-500">Đang tải danh sách khách sạn...</p>
        ) : dataToShow.length > 0 ? (
          <>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dataToShow.slice(0, visibleCount).map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    onToggleLike={handleToggleLike}
                    likedStatus={likeStatus[hotel.ten] || null}
                    onCardClick={() => setSelectedHotel(hotel)}
                  />
                ))}
              </div>
            </div>
            {dataToShow.length > 0 && visibleCount < dataToShow.length && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Xem thêm
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500">Không tìm thấy khách sạn nào phù hợp.</p>
        )}
      </div>

      <HotelModal hotel={selectedHotel} onClose={() => setSelectedHotel(null)} />
    </div>
  );
}

export default App;