import { useEffect, useRef, useState } from "react";
import {
  formatDate,
  statusOrderClass,
} from "../../../utils/utilities";
import {
  getCDCStats,
  getOrderComments,
  getRecentOrders,
  getRecentUsers,
  getStats,
} from "../../../Api/dashboard";
import { useNavigate } from "react-router-dom";
import dash1 from "../../../assets/svg/dash1.svg";
import managerIcon from "../../../assets/svg/managerIcon.svg";
import dash3 from "../../../assets/svg/dash3.svg";
import Select from "react-select";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import OrderCountsChart from "./OrderCountsChart";
import OrderStatusChart from "./OrderStatusChart";
import TotalUsersChart from "./TotalUsersChart";

const rangeOptions = [
  {
    label: "Today",
    value: "today",
  },
  {
    label: "This Week",
    value: "week",
  },
  {
    label: "This Month",
    value: "month",
  },
  {
    label: "This Year",
    value: "year",
  },
];

const summaryData02 = [
  { label: "Orders", icon: dash1 },
  { label: "Manager Handled", icon: managerIcon },
  { label: "Amount Spent", icon: dash3 },
];

const Dashboard = () => {
  const navigate = useNavigate();

  const [selectedRange, setSelectedRange] = useState("week");
  const [orders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [cdcStats, setCDCStats] = useState([]);
  const [recentComments, setRecentComments] = useState([]);
  const [orderCount, setOrderCount] = useState(0);
  const [managerOrderCount, setManagerOrderCount] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedComp, setSelectedComp] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedCostC, setSelectedCostC] = useState(null);
  const dashboardRef = useRef();

  const exportAsPDF = async () => {
    if (!dashboardRef.current) {
      console.error("Dashboard ref not set");
      return;
    }
    try {
      const imgData = await htmlToImage.toPng(dashboardRef.current, {
        backgroundColor: "transparent",
        pixelRatio: 1.4,
        useCORS: true,
        // cacheBust: false,
      });
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [img.width, img.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, img.width, img.height);
      pdf.save("dashboard.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const fetchRecentUsers = async () => {
    const res = await getRecentUsers();
    if (res?.status_code === 200) setRecentUsers(res?.data?.users.splice(0, 3));
  };

  const fetchRecentComments = async () => {
    const res = await getOrderComments();
    if (res?.status_code === 200)
      setRecentComments(res?.data?.comments.splice(0, 4));
  };

  const fetchRecentOrders = async () => {
    const res = await getRecentOrders();
    if (res?.status_code === 200)
      setRecentOrders(res?.data?.orders?.slice(0, 5));
  };

  const fetchCDCOrders = async () => {
    const res = await getCDCStats();
    if (res?.status_code === 200) setCDCStats(res?.data);
  };

  const fetchOverallStats = async (selectedRange) => {
    const res = await getStats(selectedRange);
    if (res?.status_code === 200) {
      setTotalExpense(res?.data?.total_amount);
      setOrderCount(res?.data?.total_orders);
      setManagerOrderCount(res?.data?.resolved_by_managers);
    }
  };

  useEffect(() => {
    fetchOverallStats(selectedRange);
  }, [selectedRange]);

  useEffect(() => {
    fetchRecentOrders();
    fetchRecentUsers();
    fetchRecentComments();
    fetchCDCOrders();
  }, []);

  return (
    <div>
      <div className="flex md:items-center gap-5 flex-col md:flex-row justify-start md:justify-end pt-2">
        <h3 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9">
          Dashboard
        </h3>
        <button
          onClick={exportAsPDF}
          className="formField-btn bg-[#3D3D3D] text-white flex items-center justify-center text-center gap-2.5 py-1.5 px-5 min-h-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M8.99988 18H4.99987C3.8953 17.9999 2.99987 17.1045 2.99988 15.9999L2.99996 3.99999C2.99996 2.89542 3.89539 2 4.99996 2H14.0002C15.1047 2 16.0002 2.89543 16.0002 4V9.5M13.0002 15.0355L15.0454 13M15.0454 13L17.0002 14.9435M15.0454 13V18M6.50019 6H12.5002M6.50019 9H12.5002M6.50019 12H9.50019"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export Pdf
        </button>
      </div>

      <div ref={dashboardRef}>
        {/* Order Statistics */}
        <div className="boxShadow mt-5">
          <div className="flex items-start gap-3 md:items-center flex-wrap flex-col md:flex-row justify-between mb-5">
            <h6 className="text-xl font-medium text-[#212121] leading-[30px]">
              Order Statistics
            </h6>

            <Select
              name="dashboardStats"
              className="pt-3 w-48"
              placeholder="Select Range"
              options={rangeOptions}
              onChange={(selectedOption) =>
                setSelectedRange(selectedOption.value)
              }
              value={rangeOptions.find(
                (option) => option.value === selectedRange
              )}
            />
          </div>

          <div className="boxShadow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 p-0 overflow-hidden mt-5">
            {summaryData02.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-5 md:gap-2.5 2xl:gap-5 bg-white shadow-sm px-5 md:px-4 2xl:px-5 py-4 [&:not(:first-child)]:border-t md:[&:not(:first-child)]:border-t-0 md:[&:nth-child(2)]:border-b xl:[&:nth-child(2)]:border-b-0 md:first:border-b xl:first:border-b-0 md:[&:not(:last-child)]:border-r border-solid border-[#E7E7E7]"
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  crossOrigin="anonymous"
                  className="w-[52px] 2xl:w-[60px] h-[52px] 2xl:h-[60px]"
                />
                <div>
                  <div className="text-xl 2xl:text-[30px] leading-[30px] 2xl:leading-9 font-medium text-[#212121] text-nowrap">
                    {idx === 0 && orderCount}
                    {idx === 1 && managerOrderCount}
                    {idx === 2 &&
                      "€ " +
                        Number(totalExpense.toFixed(0)).toLocaleString("en-US")}
                  </div>
                  <div className="text-sm 2xl:text-base text-[#6D6D6D] leading-6 2xl:leading-[26px] font-normal">
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Counts */}
        <div className="boxShadow mt-5">
          <OrderCountsChart />
        </div>

        {/*  orders status and total users */}
        <div className="flex gap-5 mt-5 flex-col xl:flex-row">
          {/* Order Status */}
          <OrderStatusChart />
          {/* Total Users */}
          <TotalUsersChart />
        </div>

        {/* recent orders */}
        <div className="boxShadow mt-5">
          <div className="flex items-center justify-between">
            <h6 className="text-xl font-medium text-[#212121] leading-[30px]">
              Recent Orders
            </h6>
            <p
              className="underline cursor-pointer text-base font-normal leading-[26px] text-[#282828]"
              onClick={() => navigate("/admin/orders")}
            >
              View All
            </p>
          </div>
          <div className="mt-5 custom-scrollbar">
            <table className="table min-w-[900px] lg:w-full border-separate border-spacing-0 table-zebra">
              <thead className="sticky top-0 bg-base-200">
                <tr>
                  <th className="table-title">Order ID</th>
                  <th className="table-title">Description</th>
                  <th className="table-title">Status</th>
                  <th className="table-title">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      className="relative border-b border-[#E7E7E7]"
                    >
                      <td className="table-data">{order.order_id}</td>
                      <td className="table-data">
                        {order.order_description.length > 25
                          ? `${order.order_description.slice(0, 25)}...`
                          : order.order_description}
                      </td>
                      <td className="table-data">
                        <div
                          className={`inline-block py-0.5 px-2.5 rounded-full text-sm font-medium leading-[22px] ${
                            statusOrderClass[order.orderStatus]
                          }`}
                        >
                          {order.orderStatus}
                        </div>
                      </td>
                      <td className="table-data">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* recent users, comments and CDC */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5 mt-5">
          {/* New Users */}
          <div className="boxShadow 2xl:col-span-2">
            <div className="flex items-center justify-between">
              <h6 className="text-xl font-medium text-[#212121] leading-[30px]">
                New Users
              </h6>
              <p
                className="underline cursor-pointer text-base font-normal leading-[26px] text-[#282828]"
                onClick={() => navigate("/admin/users")}
              >
                View All
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-5 w-full">
              {recentUsers.map((user, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 sm:gap-5 w-full"
                >
                  <img
                    src={user?.image}
                    alt="Profile"
                    crossOrigin="anonymous"
                    className="w-10 h-10 sm:w-[50px] sm:h-[50px] basis-10 sm:basis-[50px] grow-0 shrink-0 object-cover rounded-full"
                  />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="font-medium text-base leading-[26px] text-gray-900 truncate">{`${user?.first_name} ${user?.last_name}`}</span>
                    <div className="text-sm text-gray-900 leading-6 font-normal flex flex-wrap gap-x-2.5">
                      <span className="truncate">{user?.company}</span>
                      <span>&bull;</span>
                      <span className="truncate">{user?.department}</span>
                      <span>&bull;</span>
                      <span className="truncate">{user?.role}</span>
                    </div>
                    <span className="text-xs text-[#6D6D6D] leading-6 font-normal">
                      Joined: {formatDate(user?.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Comments */}
          <div className="boxShadow 2xl:col-span-2">
            <div className="flex items-center justify-between">
              <h6 className="text-xl font-medium text-[#212121] leading-[30px]">
                Recent Comments
              </h6>
              {/* <p
                className="underline cursor-pointer text-base font-normal leading-[26px] text-[#282828]"
                onClick={() => navigate("/admin/orders")}
              >
                View All
              </p> */}
            </div>
            <div className="mt-5 flex flex-col gap-5 w-full">
              {recentComments.map((user, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 sm:gap-5 w-full"
                >
                  <img
                    src={user?.user_image}
                    alt="Profile"
                    crossOrigin="anonymous"
                    className="w-8 h-8 sm:w-10 sm:h-10 basis-8 sm:basis-10 grow-0 shrink-0 object-cover rounded-full"
                  />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex flex-wrap gap-x-2.5 items-center">
                      <span className="text-gray-900 text-base leading-[26px] font-medium truncate">{`${user?.user_name}`}</span>
                      <span className="text-sm text-[#6D6D6D] leading-6 font-normal">
                        {formatDate(user?.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-[#6D6D6D] leading-6 font-normal line-clamp-2">
                      {user?.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CDC Orders */}
          <div className="boxShadow p-4 md:p-6 2xl:col-span-2 overflow-hidden">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-semibold text-black-800">
                CDC Orders
              </h2>
            </div>
            <div className="space-y-4 md:space-y-6">
              {/* Company Selector */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-medium text-black-700">
                  Company
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <Select
                      className="w-[80%] min-w-[150px]"
                      placeholder="Select Company"
                      onChange={(val) => {
                        setSelectedComp(val.value);
                        setSelectedDept("");
                        setSelectedCostC("");
                      }}
                      options={cdcStats.map((itm) => ({
                        value: itm.company_name,
                        label: itm.company_name,
                      }))}
                    />
                    {selectedComp && (
                      <span className="text-sm text-black-500 whitespace-nowrap shrink-0">
                        (
                        {
                          cdcStats.find((c) => c.company_name === selectedComp)
                            ?.company_total
                        }{" "}
                        orders)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Department Selector */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-medium text-black-700">
                  Department
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <Select
                      className="w-[80%] min-w-[150px]"
                      placeholder="Select Department"
                      value={
                        selectedDept
                          ? { value: selectedDept, label: selectedDept }
                          : null
                      }
                      onChange={(val) => {
                        setSelectedDept(val.value);
                        setSelectedCostC(null);
                      }}
                      options={
                        cdcStats
                          .find((itm) => itm.company_name === selectedComp)
                          ?.departments.map((dept) => ({
                            value: dept.department_name,
                            label: dept.department_name,
                          })) || []
                      }
                      isDisabled={!selectedComp}
                    />
                    {selectedDept && (
                      <span className="text-sm text-black-500 whitespace-nowrap shrink-0">
                        (
                        {
                          cdcStats
                            .find((c) => c.company_name === selectedComp)
                            ?.departments.find(
                              (d) => d.department_name === selectedDept
                            )?.department_total
                        }{" "}
                        orders)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Center Selector */}
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-medium text-black-700">
                  Cost Center
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <Select
                      className="w-[80%] min-w-[150px]"
                      menuPlacement="top"
                      placeholder="Select Cost Center"
                      value={
                        selectedCostC
                          ? { value: selectedCostC, label: selectedCostC }
                          : null
                      }
                      onChange={(val) => setSelectedCostC(val.value)}
                      options={
                        cdcStats
                          .find((itm) => itm.company_name === selectedComp)
                          ?.departments.find(
                            (dept) => dept.department_name === selectedDept
                          )
                          ?.center_costs.map((cost) => ({
                            value: cost.center_cost_name,
                            label: cost.center_cost_name,
                          })) || []
                      }
                      isDisabled={!selectedDept}
                    />
                    {selectedCostC && (
                      <span className="text-sm text-black-500 whitespace-nowrap shrink-0">
                        (
                        {
                          cdcStats
                            .find((c) => c.company_name === selectedComp)
                            ?.departments.find(
                              (d) => d.department_name === selectedDept
                            )
                            ?.center_costs.find(
                              (cc) => cc.center_cost_name === selectedCostC
                            )?.count
                        }{" "}
                        orders)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
