import React from "react";
import ReactSlider from "react-slider";

export default function FilterBar({
  filters,
  onFiltersChange,
  locations,
  amenities,
}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      onFiltersChange({
        ...filters,
        amenities: {
          ...filters.amenities,
          [name]: checked,
        },
      });
    } else if (name === "minPrice" || name === "maxPrice") {
      onFiltersChange({
        ...filters,
        [name]: parseInt(value, 10),
      });
    } else {
      onFiltersChange({
        ...filters,
        [name]: value,
      });
    }
  };

  return (
    <form className="bg-white rounded-2xl shadow-md p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        {/* Địa điểm */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-black mb-1">Địa điểm</label>
          <select
            name="location"
            value={filters.location || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black w-full"
          >
            <option value="">Tất cả</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        {/* Ngày */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-black mb-1">Ngày</label>
          <input
            type="date"
            name="date"
            value={filters.date || ""}
            onChange={handleChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-black w-full"
          />
        </div>

        {/* Ngân sách */}
        <div className="flex flex-col w-56">
          <label className="text-sm font-medium text-black mb-1">Ngân sách</label>

          <ReactSlider
            className="horizontal-slider w-full h-1 bg-blue-100 rounded-md"
            thumbClassName="w-4 h-4 bg-white border border-blue-500 rounded-full cursor-pointer"
            trackClassName="bg-blue-500 h-1 rounded"
            min={0}
            max={20000000}
            step={50000}
            value={[filters.minPrice || 0, filters.maxPrice || 20000000]}
            onChange={([min, max]) =>
              onFiltersChange({
                ...filters,
                minPrice: min,
                maxPrice: max,
              })
            }
          />

          <div className="flex justify-between mt-2">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-700">MIN</span>
              <input
                type="number"
                name="minPrice"
                min={0}
                max={filters.maxPrice || 20000000}
                value={filters.minPrice || 0}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-24 text-sm text-right text-black"
              />
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-700">MAX</span>
              <input
                type="number"
                name="maxPrice"
                min={filters.minPrice || 0}
                max={20000000}
                value={filters.maxPrice || 20000000}
                onChange={handleChange}
                className="border rounded px-2 py-1 w-24 text-sm text-right text-black"
              />
            </div>
          </div>
        </div>

        {/* Tiện nghi */}
        <div>
          <label className="block text-sm font-semibold mb-1 text-black">
            Tiện nghi
          </label>
          <div className="flex flex-wrap gap-2 max-w-xs">
            {amenities.map(({ name, label }) => (
              <label
                key={name}
                className="flex items-center space-x-1 text-sm text-black"
              >
                <input
                  type="checkbox"
                  name={name}
                  checked={filters.amenities[name] || false}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
