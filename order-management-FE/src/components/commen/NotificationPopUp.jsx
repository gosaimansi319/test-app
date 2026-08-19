import { Card } from "@material-tailwind/react";
import PendingIcon from "../../assets/svg/PendingIcon.svg";
import ApprovedIcon from "../../assets/svg/ApprovedIcon.svg";
import RejectedIcon from "../../assets/svg/RejectedIcon.svg";
import ShippedIcon from "../../assets/svg/ShippedIcon.svg";
import ProcessingIcon from "../../assets/svg/ProcessingIcon.svg";
import CancelledIcon from "../../assets/svg/CacelledIcon.svg";
import overdueIcon from "../../assets/svg/overdueIcon.svg";
import recievedIcon from "../../assets/svg/recievedIcon.svg";

import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/utilities";

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

const NotificationPopup = ({ notifications = [], onClose, isAdmin }) => {
  const navigate = useNavigate();

  const handleAllNotification = () => {
    onClose;
    if (isAdmin) {
      navigate("/admin/notifications");
    } else {
      navigate("/user/notifications");
    }
  };

  return (
    <Card className="w-[310px] max-h-[400px] cursor-default overflow-y-auto shadow-xl absolute top-12 right-0 z-50 bg-white border border-gray-200 rounded-[10px]">
      {/* Header */}
      <div className="bg-[#454545] text-white px-5 py-2.5 rounded-t-md">
        <h3 className="text-sm font-normal leading-6">Notifications</h3>
      </div>

      {/* Content */}
      <div className="p-5 pt-2.5">
        <div className="divide-y divide-[#E7E7E7] border-b border-solid border-[#E7E7E7]">
          {notifications.length > 0 ? (
            notifications?.slice(0, 4).map((item, index) => (
              <div key={index} className="py-2.5">
                <div className=" flex gap-1 items-center">
                  <div className="w-5 h-5 flex items-center justify-center rounded-full">
                    <div className="text-lg">
                      {getStatusIcon(
                        item?.productSnapshot?.status ||
                          item?.relatedOrder?.status
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex justify-between items-center">
                    <p className="font-medium text-[#212121] text-sm leading-6">
                      {item?.productSnapshot?.status ||
                        item?.relatedOrder?.status}
                    </p>
                    <p className="text-xs text-[#888888] whitespace-nowrap leading-6">
                      {formatDate(
                        item?.productSnapshot?.createdAt ||
                          item?.relatedOrder?.createdAt
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-[#212121] leading-6 truncate">
                  {item?.relatedOrder?.order_description}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-sm text-gray-400 py-4">
              No notifications.
            </p>
          )}
        </div>

        {/* All Notifications Button */}
        <div className="mt-2 text-center">
          <button
            onClick={handleAllNotification}
            className="text-[#282828] underline text-sm font-normal cursor-pointer"
          >
            All Notifications
          </button>
        </div>
      </div>
    </Card>
  );
};

export default NotificationPopup;
