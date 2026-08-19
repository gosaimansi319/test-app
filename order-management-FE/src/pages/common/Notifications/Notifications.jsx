import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminNotifications,
  fetchUserNotifications,
} from "../../../store/Notifications/notificationThunk";
import PendingIcon from "../../../assets/svg/PendingIcon.svg";
import ApprovedIcon from "../../../assets/svg/ApprovedIcon.svg";
import RejectedIcon from "../../../assets/svg/RejectedIcon.svg";
import ShippedIcon from "../../../assets/svg/ShippedIcon.svg";
import ProcessingIcon from "../../../assets/svg/ProcessingIcon.svg";
import CancelledIcon from "../../../assets/svg/CacelledIcon.svg";
import overdueIcon from "../../../assets/svg/overdueIcon.svg";
import recievedIcon from "../../../assets/svg/recievedIcon.svg";
import { formatDate, statusProductOptions } from "../../../utils/utilities";
import PageLoader from "../../../components/commen/PageLoader";

const getStatusIcon = (status) => {
  switch (status) {
    case "Pending Review":
      return <img src={PendingIcon} className="w-6 h-6 text-amber-500" />;
    case "In Analysis":
      return <img src={ShippedIcon} className="w-6 h-6 text-blue-500" />;
    case "Approved":
      return <img src={ApprovedIcon} className="w-6 h-6 text-green-600" />;
    case "Not Approved":
      return <img src={RejectedIcon} className="w-6 h-6 text-red-500" />;
    case "Ordered":
      return <img src={RejectedIcon} className="w-6 h-6 text-red-500" />;
    case "In Transit":
      return <img src={ProcessingIcon} className="w-6 h-6 text-purple-500" />;
    case "Received":
      return <img src={recievedIcon} className="w-6 h-6 text-gray-500" />;
    case "Return":
      return <img src={overdueIcon} className="w-6 h-6 text-gray-500" />;
    case "Issue (RMA)":
      return <img src={overdueIcon} className="w-6 h-6 text-gray-500" />;
    case "Cancelled":
      return <img src={CancelledIcon} className="w-6 h-6 text-gray-500" />;
    default:
      return <img src={PendingIcon} className="w-6 h-6 text-gray-500" />;
  }
};

const Notifications = () => {
  const dispatch = useDispatch();
  const { notifications, loading } = useSelector(
    (state) => state.notifications
  );
  const [filter, setFilter] = useState("All");
  const loggedUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");

  useEffect(() => {
    if (JSON.parse(loggedUser).role_name === "user") {
      dispatch(fetchUserNotifications());
    } else {
      dispatch(fetchAdminNotifications());
    }
  }, [dispatch, loggedUser]);

  const filteredNotifications = notifications
    .filter((notification) =>
      filter === "All" ? true : notification?.productSnapshot?.status === filter
    );

  return (
    <div className="boxShadow">
      {loading ? (
        <PageLoader />
      ) : (
        <div>
          <div className="pb-4 mb-2 sticky bg-white -top-5 z-[11] p-5 -m-5">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div>
                <h3 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9">
                  All Notifications
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-base leading-[26px] font-normal text-[#212121]">
                  Show
                </span>
                <select
                  className="bg-white border border-[#D1D1D1] rounded-md py-2 h-10 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {statusProductOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="divide-[#E7E7E7]">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className="flex items-start flex-wrap md:flex-nowrap min-h-[66px] gap-2.5 border-b border-b-solid border-[#E7E7E7] md:px-5 py-3 hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 h-6 w-6 basis-6 grow-0 pt-2">
                    {getStatusIcon(notification?.productSnapshot?.status || notification?.relatedOrder?.status)}
                  </div>
                  <div className="flex-1 md:basis-44 grow-1 md:grow-0 shrink-1 md:shrink-0">
                    <p className="text-base font-normal text-[#212121] leading-[26px] pt-2">
                      {notification?.productSnapshot?.status || notification?.relatedOrder?.status}
                    </p>
                  </div>
                  <div className="basis-[100%] md:flex-1 order-4 md:order-none text-base font-normal text-[#212121] leading-[26px]">
                    {notification?.relatedOrder?.order_id} <br />
                    {notification?.relatedOrder?.order_description}
                  </div>
                  <div className="basis-28 text-right order-3 md:order-none grow-0 shrink-0 text-base font-normal text-[#888888] leading-[26px]">
                    {formatDate(notification?.productSnapshot?.createdAt  || notification?.relatedOrder?.createdAt)}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
