import { useState } from "react";
import CrossIcon from '../../assets/svg/CrossIcon.svg';
import { statusOrderOptions } from "../../utils/utilities";
const filterOptions = {
  // company_name: "Company",
  // department_name: "Department",
  center_cost_name: "Center Cost",
};

const OrderFilterPopup = ({
  show,
  onApply,
  onClear,
  filterType,
  setFilterType,
  filterValue,
  setFilterValue,
  panelType="admin"
}) => {
  const [selectedTab, setSelectedTab] = useState("Status");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const handleApply = () => {
    onApply({
      status: selectedStatus,
      date: selectedDate,
    });
  };

  const handleClear = () => {
    setSelectedStatus("");
    setSelectedDate("");
    setFilterValue("");
    onClear();
  };

  if (!show) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg z-50 p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-600 font-medium">Filter</span>
        <button onClick={handleClear}>
          <img src={CrossIcon} className="w-5 h-5" alt="" />
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-gray-200 mb-4">
        {["Status", "Date",  panelType==="admin" && "Other"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`flex-1 text-sm font-medium text-center pb-2 ${
              selectedTab === tab
                ? "text-black border-b-2 border-gray-700"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Status Section */}
      {selectedTab === "Status" && (
        <div className="flex flex-col gap-3 mb-4">
          {statusOrderOptions.map((status) => (
            <label
              key={status.value}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            >
              <input
                type="radio"
                name="status"
                value={status}
                checked={selectedStatus === status.value}
                onChange={() => setSelectedStatus(status.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span>{status.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* Date Section */}
      {selectedTab === "Date" && (
        <div className="mb-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Other Section */}
      {(selectedTab === "Other") && (
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            {Object.entries(filterOptions).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="filter"
                  value={key}
                  checked={filterType === key}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none h-3 w-3 border border-black rounded-full checked:bg-black checked:border-black"
                />
                {label}
              </label>
            ))}
          </div>

          <input
            type="text"
            placeholder="Enter value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Apply Button */}
      <div className="flex justify-end">
        <button
          onClick={handleApply}
          className="bg-gray-800 text-white text-sm px-4 py-2 rounded-md  transition-colors focus:outline-none focus:ring-2 "
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default OrderFilterPopup;
