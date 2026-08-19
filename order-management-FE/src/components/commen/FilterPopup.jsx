import { useEffect, useRef } from "react";
import CrossIcon from "../../assets/svg/CrossIcon.svg";

const filterOptions = ["contact_person", "company_name", "address"];
const FilterPopup = ({
  filterType,
  setFilterType,
  filterValue,
  setFilterValue,
  onApply,
  onClear,
  onClose,
  show,
}) => {
  const popupRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose(); // Close when clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!show) return null;

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg z-50 p-4"
    >
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600 font-medium">Filter</span>
        <button onClick={onClear}>
          <img src={CrossIcon} className="w-5 h-5" alt="" />
        </button>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex flex-col gap-2">
          {filterOptions.map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="radio"
                name="filter"
                value={type}
                checked={filterType === type}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none h-3 w-3 border border-black rounded-full checked:bg-black checked:border-black"
              />
              {type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </label>
          ))}
        </div>

        <input
          type="text"
          placeholder="Enter value"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex justify-end">
          <button
            className="w-1/2 bg-[#000000b9] text-white font-medium py-2 rounded-md text-sm transition duration-150"
            onClick={onApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPopup;
