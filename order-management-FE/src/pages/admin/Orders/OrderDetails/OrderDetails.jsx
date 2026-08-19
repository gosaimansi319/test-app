import { memo, useEffect, useState } from "react";
import Arrow from "../../../../assets/svg/arrow-left.svg";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PrivateObservationsTab } from "./Tabs/PrivateObservationsTab";
import { OrderHistoryTab } from "./Tabs/OrderHistoryTab";
import { PublicObservationsTab } from "./Tabs/PublicObservationsTab";
import { getOrderById } from "../../../../store/Orders/ordersThunk";
import { formatDate, statusProductClass } from "../../../../utils/utilities";
import PageLoader from "../../../../components/commen/PageLoader";
import { ReviewsTab } from "./Tabs/ReviewsTab";

const OrderDetails = () => {
  const location = useLocation();

  const { product } = location.state || {};
  const [activeTab, setActiveTab] = useState("Order History");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [viewProduct, setViewProduct] = useState(null);
  const { orderById, loading } = useSelector((state) => state.order);

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
    // dispatch(getOrderById(orderId));
  };

  const TabContent = memo(({ activeTab, orderById }) => {
    switch (activeTab) {
      case "Order History":
        return (
          <OrderHistoryTab
            orderById={orderById}
            viewProduct={viewProduct || product}
          />
        );
      case "private":
        return (
          <PrivateObservationsTab
            orderById={orderById}
            viewProduct={viewProduct || product}
          />
        );
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
        return (
          <OrderHistoryTab
            orderById={orderById}
            viewProduct={viewProduct || product}
          />
        );
    }
  });

  return (
    <div className="boxShadow min-h-[100%]">
      {loading ? (
        <PageLoader />
      ) : (
        <div>
          {/* Order Header */}
          <h3 className="sm:hidden text-2xl text-[#212121] font-bold leading-9 flex gap-2.5">
            <img
              onClick={() => navigate(-1)}
              src={Arrow}
              alt="Arrow"
              className="cursor-pointer"
            />
            Order Detail
          </h3>
          <div className="mt-5 sm:mt-0 flex justify-center flex-col md:flex-row gap-10">
            {/* Product Image */}
            <div className="w-full md:col-span-2 max-h-[500px]">
              <img
                src={`${viewProduct?.image}`}
                alt="Canon All-in-One Printer"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Product Details */}
            <div className="w-full">
              <div className="flex-col md:flex-row flex justify-between items-start">
                <div className="text-[#6D6D6D] text-sm font-normal leading-6 flex flex-col gap-1">
                  <p>Order ID: {orderById?.order_id}</p>
                  <p>
                    {orderById?.company_name}{" "}
                    <span className="text-[#D1D1D1]">|</span>{" "}
                    {orderById?.department_name}
                  </p>
                </div>

                <div className="text-sm text-[#212121] font-normal leading-6">
                  {formatDate(orderById?.createdAt)}
                </div>
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
                  </span>
                  ({viewProduct?.total_reviews || 0} reviews)
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <h2 className="text-base text-[#212121] leading-6 font-medium">
                  Description
                </h2>
                <p className="text-sm text-[#6D6D6D] font-normal leading-6">
                  {orderById?.order_description}
                </p>
              </div>
              <div className="mt-5 flex flex-col gap-5">
                <div className="text-base font-medium text-[#212121] leading-6">
                  Quantity
                  <span className="ml-[10px] text-sm font-normal leading-6 text-[#6D6D6D]">
                    {viewProduct?.quantity}
                  </span>
                </div>

                <div className="text-base font-medium text-[#212121] leading-6">
                  Status
                  <span
                    className={`font-medium text-sm leading-[22px] bg-[#D8F4F5] py-[2px] px-2.5 rounded-[20px] ml-[20px] ${statusProductClass[viewProduct?.status]
                      }`}
                  >
                    {viewProduct?.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs and Timeline Section */}
          <div>
            <div className="mt-5">
              <div className="flex items-center bg-[#F6F6F6] rounded-[10px] p-[5px]">
                <button
                  className={`text-xs flex flex-wrap sm:flex-nowrap sm:text-sm py-[9px] px-[14px] sm:px-[35px] font-medium leading-[22px] text-sm${activeTab === "Order History"
                      ? " border border-[#282828] rounded-[10px] text-white bg-[#282828]"
                      : " text-[#454545]"
                    }`}
                  onClick={() => handleTabChange("Order History")}
                >
                  Order History
                </button>

                <button
                  className={`text-xs flex flex-wrap sm:flex-nowrap sm:text-sm py-[9px] px-[14px] sm:px-[35px] font-medium leading-[22px] text-sm${activeTab === "private"
                      ? " border border-[#282828] rounded-[10px] text-white bg-[#282828]"
                      : " text-[#454545]"
                    }`}
                  onClick={() => handleTabChange("private")}
                >
                  Private Observations
                </button>

                <button
                  className={`text-xs flex flex-wrap sm:flex-nowrap sm:text-sm py-[9px] px-[14px] sm:px-[35px] font-medium leading-[22px] text-sm${activeTab === "public"
                      ? " border border-[#282828] rounded-[10px] text-white bg-[#282828]"
                      : " text-[#454545]"
                    }`}
                  onClick={() => handleTabChange("public")}
                >
                  Public Observations
                </button>
                <button
                  className={`text-xs flex flex-wrap sm:flex-nowrap sm:text-sm py-[9px] px-[14px] sm:px-[35px] font-medium leading-[22px] text-sm${activeTab === "reviews"
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
            <TabContent activeTab={activeTab} orderById={orderById} />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
