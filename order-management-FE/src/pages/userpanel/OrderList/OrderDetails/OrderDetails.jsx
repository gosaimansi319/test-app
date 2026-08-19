import { useEffect, useState } from "react";
import Arrow from "../../../../assets/svg/arrow-left.svg";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getOrderById,
  requestReturn,
  updateOrderById,
} from "../../../../store/UserOrders/userOrdersThunk";
import { useDispatch, useSelector } from "react-redux";
import { PrivateObservationsTab } from "./Tabs/PrivateObservationsTab";
import { OrderHistoryTab } from "./Tabs/OrderHistoryTab";
import { PublicObservationsTab } from "./Tabs/PublicObservationsTab";
import { ReviewsTab } from "./Tabs/ReviewsTab";
import StatusChangeDialog from "./Dialog/StatusChangeDialog";
import { formatDate, statusProductClass } from "../../../../utils/utilities";
import { fetchNotificationsCount } from "../../../../store/Notifications/notificationThunk";
import PageLoader from "../../../../components/commen/PageLoader";
import toast from "react-hot-toast";

const OrderDetails = () => {
  const location = useLocation();
  const { product } = location.state || {};
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Order History");
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [dialogName, setDialogName] = useState("");

  const dispatch = useDispatch();
  const { orderId } = useParams();
  const [viewProduct, setViewProduct] = useState(null);
  const { orderById, loading } = useSelector((state) => state.userOrder);

  useEffect(() => {
    dispatch(getOrderById(orderId));
  }, [dispatch, orderId]);

  useEffect(() => {
    if (product) {
      const myProduct = orderById?.products?.find(
        (p) => p?.product_id === product?.product_id
      );
      setViewProduct(myProduct);
    }
  }, [orderById]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleDownload = async (url, filename) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const handleStatusDialogOpen = (status) => {
    setOpenStatusDialog(!openStatusDialog);
    setDialogName(status);
  };


  const handleStatusChange = (status, file, type) => {
    if (type === "changeStatus") {
      const formData = new FormData();
      formData.append("status", status);
      formData.append("product_id", viewProduct?.product_id);

      if (file) {
        let docFieldKey = `${viewProduct.product_name
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "")
          }_doc`;
        formData.append(docFieldKey, file);
      }

      if (viewProduct.status === "Received" || viewProduct.status === "Issue (RMA)") {
        dispatch(updateOrderById({ orderId: orderById._id, orderData: formData }))
          .then(() => dispatch(getOrderById(orderId)))
          .then(() => dispatch(fetchNotificationsCount()));
      } else {
        toast.error("You can update this once you received")
      }
    } else {
      const formData = new FormData();
      formData.append("reason_for_return", status);

      if (file) {
        formData.append("file_for_return_reason", file);
      }

      if (viewProduct.status === "Received") {
        dispatch(
          requestReturn({ orderId: orderById._id, productId: viewProduct?.product_id, orderData: formData })
        ).then(() => dispatch(getOrderById(orderId)));
      } else {
        toast.error("You can return the order once you received")
      }

    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "Order History":
        return (
          <OrderHistoryTab
            orderById={orderById}
            viewProduct={viewProduct || product}
          />
        );
      case "private":
        return <PrivateObservationsTab />;
      case "public":
        return (
          <PublicObservationsTab
            orderById={orderById}
            viewProduct={viewProduct || product}
          />
        );
      case "reviews":
        return (
          <ReviewsTab
            orderById={orderById}
            viewProduct={viewProduct || product}
          />
        );
      default:
        return <OrderHistoryTab orderById={orderById} />;
    }
  };

  return (
    <div className="boxShadow">
      {loading ? (
        <PageLoader />
      ) : (
        <div>
          {/* Order Header */}
          <h3 className="md:hidden text-2xl text-[#212121] font-bold leading-9 flex gap-2.5">
            <img
              onClick={() => navigate(-1)}
              src={Arrow}
              alt="Arrow"
              className="cursor-pointer"
            />
            Order Detail
          </h3>
          <div className="mt-5 md:mt-0 grid md:grid-cols-5 gap-5 md:gap-10">
            {/* Product Image */}
            <div className="w-full md:col-span-2 max-h-[500px]">
              <img
                src={`${viewProduct?.image}`}
                alt="Canon All-in-One Printer"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Product Details */}
            <div className="w-full md:col-span-3">
              <div className="flex-col md:flex-row flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <p className="text-[#6D6D6D] text-sm font-normal leading-6 ">
                    Order ID: {orderById?.order_id}
                  </p>
                  <p className="text-[#6D6D6D] text-sm font-normal leading-6">
                    {orderById?.company_name}{" "}
                    <span className="text-[#D1D1D1]">|</span>{" "}
                    {orderById?.department_name}
                  </p>
                </div>

                <p className="text-sm text-[#212121] font-normal leading-6">
                  {formatDate(orderById?.createdAt)}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-1 ">
                <h1 className="text-2xl text-[#282828] font-bold leading-9 ">
                  {viewProduct?.product_name}
                </h1>
                <p className="font-sm text-[#212121] font-bold leading-6">
                  <span className="font-medium">Brand:</span>{" "}
                  {viewProduct?.brand_name}
                </p>
                <div className="text-sm font-normal text-[#6D6D6D] leading-6">
                  <span className="text-[#FF9800] text-[20px]">★</span>
                  <span className="text-[#212121]">
                    {viewProduct?.average_rating || 0}
                  </span>{" "}
                  ({viewProduct?.total_reviews} reviews)
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <h2 className="text-base text-[#212121] leading-6 font-medium">
                  Description
                </h2>
                <p className="text-sm text-[#6D6D6D] font-normal leading-6">
                  {orderById?.order_description}
                </p>
                {orderById?.image && (
                  <div className="mt-5 flex flex-col gap-2.5">
                    <h2 className="text-base text-[#212121] leading-6 font-medium">
                      Attachments
                    </h2>
                    <button
                      onClick={() =>
                        handleDownload(
                          `${orderById.image}`,
                          `${orderById?.image?.split("/").pop().split("?")[0]}`
                        )
                      }
                      className="flex items-center justify-between bg-gray-100 text-sm text-[# ] px-4 py-2 rounded-md w-fit hover:bg-gray-200 transition"
                    >
                      {orderById?.image?.split("/").pop().split("?")[0]}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-col gap-5">
                <div className="text-base font-medium text-[#212121] leading-6">
                  Quantity
                  <span className="ml-[10px] text-sm font-normal leading-6 text-[#6D6D6D]">
                    {viewProduct?.quantity}
                  </span>
                </div>
                {orderById?.urgent && (
                  <div className="text-base font-medium text-[#212121] leading-6">
                    Reason for requesting an urgent order
                    <br />
                    <span className=" text-sm font-normal leading-6 text-[#6D6D6D]">
                      {orderById.reason_for_urgency}
                    </span>
                  </div>
                )}
                <div className="text-base font-medium text-[#212121] leading-6">
                  Delivery Location
                  <br />
                  <span className=" text-sm font-normal leading-6 text-[#6D6D6D]">
                    {orderById?.location}
                  </span>
                </div>
                <div className="text-base font-medium text-[#212121] leading-6">
                  Status
                  <span
                    className={`inline-block ml-4 py-[2px] px-2.5 rounded-full text-xs font-medium leading-[22px] ${statusProductClass[viewProduct?.status]
                      }`}
                  >
                    {viewProduct?.status}
                  </span>
                </div>
                <div className="flex gap-2.5 md:gap-[20px]">
                  <button
                    type="button"
                    onClick={() => handleStatusDialogOpen("changeStatus")}
                    className="bg-gray-800 text-white px-4 md:px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Change Status
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusDialogOpen("requestReturn")}
                    className="bg-gray-300 text-gray px-4 md:px-6 py-2 rounded-md transition-colors"
                  >
                    Request Return
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs and Timeline Section */}
          <div>
            <div className="mt-5">
              <div className="flex items-center bg-[#F6F6F6] rounded-[10px] p-[5px]">
                <button
                  className={`text-[10px] flex flex-wrap md:flex-nowrap md:text-sm py-[9px] px-[14px] md:px-[35px] font-medium leading-4 md:leading-[22px] text-sm${activeTab === "Order History"
                    ? " border border-[#282828] rounded-[10px] text-white bg-[#282828]"
                    : " text-[#454545]"
                    }`}
                  onClick={() => handleTabChange("Order History")}
                >
                  Order History
                </button>
                <button
                  className={`text-[10px] flex flex-wrap md:flex-nowrap md:text-sm py-[9px] px-[14px] md:px-[35px] font-medium leading-4 md:leading-[22px] text-sm${activeTab === "public"
                    ? " border border-[#282828] rounded-[10px] text-white bg-[#282828]"
                    : " text-[#454545]"
                    }`}
                  onClick={() => handleTabChange("public")}
                >
                  Public Observations
                </button>

                <button
                  className={`text-[10px] flex flex-wrap md:flex-nowrap md:text-sm py-[9px] px-[14px] md:px-[35px] font-medium leading-4 md:leading-[22px] text-sm${activeTab === "reviews"
                    ? " border border-[#282828] rounded-[10px] text-white bg-[#282828]"
                    : " text-[#454545]"
                    }`}
                  onClick={() => handleTabChange("reviews")}
                >
                  Reviews
                </button>
              </div>
            </div>

            {/* Render tab content based on active tab */}
            {renderTabContent()}
          </div>

          {/* Status Change Dialog */}
          <StatusChangeDialog
            open={openStatusDialog}
            handleOpen={handleStatusDialogOpen}
            onStatusChange={handleStatusChange}
            dialogType={dialogName}
            order={orderById}
          />
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
