import { useState } from "react";
import CrossIcon from "../../assets/svg/CrossIcon.svg";

const ProductFilterPopup = ({ show, onApply, onClear }) => {
  const [selectedTab, setSelectedTab] = useState("Name");
  const [searchName, setSearchName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const roles = ["Manager", "Admin"];

  const handleApply = () => {
    onApply({
      name: searchName,
      role: selectedRole,
      status: selectedStatus,
      date: selectedDate,
    });
  };

  const handleClear = () => {
    setSearchName("");
    setSelectedRole("");
    setSelectedStatus("");
    setSelectedDate("");
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
        {["Name", "Role", "Date"].map((tab) => (
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

      {/* Name Search Section */}
      {selectedTab === "Name" && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Role Section */}
      {selectedTab === "Role" && (
        <div className="flex flex-col gap-3 mb-4">
          {roles.map((role) => (
            <label
              key={role}
              className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={selectedRole === role}
                onChange={() => setSelectedRole(role)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span>{role}</span>
            </label>
          ))}
        </div>
      )}

      {/* Date Section */}
      {selectedTab === "Date" && (
        <div className="flex flex-col gap-3 mb-4">
          <label className="text-sm text-gray-700">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Apply Button */}
      <div className="flex justify-end">
        <button
          onClick={handleApply}
          className="bg-gray-800 text-white text-sm px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default ProductFilterPopup;
