import { useEffect, useRef, useState } from "react";
import VarticalDotIcon from "../../../assets/svg/basil_other-1-outline.svg";
import FilterButton from "../../../assets/svg/FilterButton.svg";
import viewDetailIcon from "../../../assets/svg/view-detail.svg";
import cancelOrderIcon from "../../../assets/svg/cancel-order.svg";
import AddComment from "../../../assets/svg/AddComment.svg";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrders,
  deleteOrderById,
  bulkDeleteOrder,
  cancelOrder,
} from "../../../store/UserOrders/userOrdersThunk";
import Pagination from "../../../components/commen/Pagination";
import ConfirmDeleteModal from "../../../components/commen/ConfirmDeleteModal";
import OrderFilterPopup from "../../../components/commen/OrderFilterPopup";
import { CancelOrderModal } from "../../../components/commen/CancelOrderModal";
import {
  Button,
  Menu,
  MenuHandler,
  MenuItem,
  MenuList,
} from "@material-tailwind/react";
import { statusOrderClass } from "../../../utils/utilities";
import { fetchNotificationsCount } from "../../../store/Notifications/notificationThunk";
import { Tooltip, Typography } from "@material-tailwind/react";
import updateIcon from "../../../assets/svg/updateicons.svg";

const OrdersList = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState("center_cost_name");
  const [filterValue, setFilterValue] = useState("");

  const [filterValueParams, setFilterValueParams] = useState({});

  let filterOptions = [
    "order_name",
    "company_name",
    "department_name",
    "status",
  ];

  const { orders, loading } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(
      fetchOrders({
        page: currentPage,
        limit: itemsPerPage,
        ...filterValueParams,
      })
    )
      .then((res) => {
        if (res.payload) {
          if (res.payload.pagination) {
            setTotalItems(res.payload.pagination.total_items);
          }
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [dispatch, currentPage, itemsPerPage]);

  // const toggleSelection = (id) => {
  //   if (selectedIds.length === 0) {
  //     setDeleteOrderId(id);
  //   } else {
  //     setDeleteOrderId(null);
  //   }
  //   if (selectedIds.includes(id)) {
  //     setSelectedIds(selectedIds.filter((item) => item !== id));
  //   } else {
  //     setSelectedIds([...selectedIds, id]);
  //   }
  // };

  // const handleSelectAll = () => {
  //   if (selectedIds.length === orders.length) {
  //     setSelectedIds([]);
  //   } else {
  //     setSelectedIds(orders?.map((order) => order._id));
  //   }
  // };

  const handleConfirmDelete = () => {
    const isBulkDelete =
      selectedIds.length > 1 && selectedIds.length === orders.length;
    const idsToDelete = deleteOrderId ? [deleteOrderId] : selectedIds;

    if (isBulkDelete) {
      dispatch(bulkDeleteOrder({ page: currentPage, limit: itemsPerPage }))
        .unwrap()
        .then(() => {
          setSelectedIds([]);
          setShowDeleteModal(false);
          setDeleteOrderId(null);
          dispatch(
            fetchOrders({ page: currentPage, limit: itemsPerPage })
          ).then((res) => {
            if (res.payload?.pagination) {
              setTotalItems(res.payload.pagination.total_items);
            }
          });
        });
    } else {
      Promise.all(idsToDelete.map((id) => dispatch(deleteOrderById(id)))).then(
        () => {
          setSelectedIds([]);
          setShowDeleteModal(false);
          setDeleteOrderId(null);
          dispatch(
            fetchOrders({ page: currentPage, limit: itemsPerPage })
          ).then((res) => {
            if (res.payload?.pagination) {
              setTotalItems(res.payload.pagination.total_items);
            }
          });
        }
      );
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  const handleApplyFilter = (filterData) => {
    setShowFilter(false); // Hide the filter popup

    const filterParams = {
      page: 1,
      limit: itemsPerPage,
      orderStatus: filterData.status,
      date: filterData.date,
    };

    setFilterValueParams({
      orderStatus: filterData.status,
      date: filterData.date,
    });

    dispatch(fetchOrders(filterParams)).then((res) => {
      if (res.payload?.pagination) {
        setTotalItems(res.payload.pagination.total_items);
        setCurrentPage(1);
      }
    });
  };

  const handleRemoveFilter = () => {
    setFilterType("");
    setFilterValue("");
    setShowFilter(false);
    setFilterValueParams({});

    const defaultParams = {
      page: 1,
      limit: itemsPerPage,
    };

    dispatch(fetchOrders(defaultParams)).then((res) => {
      if (res.payload?.pagination) {
        setTotalItems(res.payload.pagination.total_items);
        setCurrentPage(1);
      }
    });
  };

  // Initiates the cancel process by showing the modal
  const handleInitiateCancelOrder = (order) => {
    setCancelOrderId(order);
    setShowCancelModal(true);
  };

  // Actually cancels the order after confirmation
  const handleConfirmCancelOrder = () => {
    setCancelLoading(true);

    let form = new FormData();
    form.append("status", "Cancelled");

    dispatch(cancelOrder({ orderId: cancelOrderId._id }))
      .unwrap()
      .then(() => {
        // Reset states and refresh orders
        setCancelOrderId(null);
        setShowCancelModal(false);
        setCancelLoading(false);

        dispatch(fetchOrders({ page: currentPage, limit: itemsPerPage })).then(
          (res) => {
            if (res.payload?.pagination) {
              setTotalItems(res.payload.pagination.total_items);
            }
          }
        );
      })
      .then(() => dispatch(fetchNotificationsCount()))
      .catch((error) => {
        console.error("Error cancelling order:", error);
        setCancelLoading(false);
        setShowCancelModal(false);
      });
  };

  const filterRef = useRef(null);

  const handleClickOutside = (event) => {
    if (filterRef.current && !filterRef.current.contains(event.target)) {
      setShowFilter(false);
    }
  };

  useEffect(() => {
    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  const isThirtyMinutesPassed = (createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    const thirtyMinutesInMs = 30 * 60 * 1000;

    return currentTime - createdTime >= thirtyMinutesInMs;
  };

  return (
    <div className="p-5 shadow-[0px_4px_16px_0px_rgba(12,12,13,0.05)] rounded-[20px] bg-white">
      <div className="sticky bg-white -top-5 z-[11] p-5 -m-5">
        <h3 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9">
          Order List
        </h3>

        <div className="flex items-center justify-between gap-5 pt-5 md:justify-end sm:pt-0">
          <button
            className="formField-btn"
            onClick={() => navigate("/user/create-order")}
          >
            Create Order
          </button>
          <span className="relative" ref={filterRef}>
            <img
              src={FilterButton}
              alt="FilterButton"
              className="cursor-pointer"
              onClick={() => setShowFilter(!showFilter)}
            />
            <OrderFilterPopup
              show={showFilter}
              filterType={filterType}
              filterOptions={filterOptions}
              setFilterType={setFilterType}
              filterValue={filterValue}
              setFilterValue={setFilterValue}
              onApply={handleApplyFilter}
              onClear={handleRemoveFilter}
              onClose={() => setShowFilter(false)}
              panelType="user"
            />
          </span>
        </div>
      </div>
      <div className="mt-5 custom-scrollbar">
        <table className="table min-w-[900px] lg:w-full border-separate border-spacing-0 table-zebra">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th className="table-title font-bold">Order ID</th>
              <th className="table-title font-bold">Description</th>
              <th className="table-title font-bold">Status</th>
              <th className="table-title font-bold">Date</th>
              <th className="table-title font-bold">Approved</th>
              <th className="table-title font-bold text-nowrap">
                Not Approved
              </th>
              <th className="table-title font-bold text-nowrap">In Analysis</th>
              <th className="table-title font-bold md:sticky md:right-0 md:bg-white md:z-10 md:border-l text-center md:border-[#E7E7E7] md:border-b">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-5 text-gray-500">
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-gray-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : orders && orders.length > 0 ? (
              orders.map((order) => (
                <tr
                  key={order._id}
                  className="relative border-b border-[#E7E7E7]"
                >
                  <td className="table-data text-nowrap">{order.order_id}</td>
                  <td className="table-data text-nowrap">
                    {order.order_description.length > 25
                      ? `${order.order_description.slice(0, 25)}...`
                      : order.order_description}
                  </td>
                  <td className="table-data text-nowrap">
                    <div
                      className={`inline-block py-[2px] px-2.5 rounded-full text-xs font-medium leading-[22px] ${statusOrderClass[order.orderStatus]
                        }`}
                    >
                      {order.orderStatus}
                    </div>
                  </td>
                  <td className="table-data text-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {order?.product_status_counts?.approved +
                      "/" +
                      order?.product_status_counts?.total}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {order?.product_status_counts?.not_approved +
                      "/" +
                      order?.product_status_counts?.total}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {order?.product_status_counts?.in_analysis +
                      "/" +
                      order?.product_status_counts?.total}
                  </td>
                  <td className="relative table-data md:sticky md:right-0 md:bg-white md:border-l md:border-b md:border-[#E7E7E7] z-[2]">
                    <Menu placement="bottom-end">
                      <MenuHandler>
                        <Button className="h-6 w-6 rounded-lg flex mx-auto items-center justify-center bg-transparent border-none cursor-pointer shadow-none p-0">
                          <img src={VarticalDotIcon} alt="icon" />
                        </Button>
                      </MenuHandler>
                      <MenuList className="p-2.5 bg-white rounded-[10px] z-50 w-[182px] border border-[#ebe8e8] absolute top-[40px] right-[90%] flex flex-col shadow-[0px_4px_4px_-4px_rgba(12,12,13,0.05)]">
                        <MenuItem
                          className="flex items-center gap-2.5 p-2.5"
                          onClick={() => {
                            navigate(`/user/view-order/${order?._id}`);
                          }}
                        >
                          <img src={viewDetailIcon} alt="viewDetailIcon" />
                          <span className="text-base font-normal leading-[26px] text-[#212121]">
                            View Order
                          </span>
                        </MenuItem>

                        <MenuItem
                          className="text-error flex items-center gap-2.5 p-2.5 "
                          onClick={() => {
                            navigate(`/user/update-order/${order?._id}`, {
                              state: { orderId: order?._id },
                              replace: true,
                            });
                            // setOpenDropdown(false);
                          }}
                          disabled={
                            isThirtyMinutesPassed(order?.createdAt)
                              ? true
                              : false
                          }
                        >
                          <img src={updateIcon} alt="updateIcon" />
                          <span className="text-base font-normal leading-[26px] text-[#212121]">
                            Update Order
                          </span>
                        </MenuItem>
                        <div className="absolute top-[69px] right-[14px]">
                          <Tooltip
                            content={
                              <div className="w-27">
                                <Typography
                                  variant="small"
                                  color="white"
                                  className="font-normal opacity-70 "
                                >
                                  You can update the order within 30 mins
                                </Typography>
                              </div>
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                              className="h-5 w-5 cursor-pointer text-blue-gray-500"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                              />
                            </svg>
                          </Tooltip>
                        </div>

                        {order?.orderStatus === "Completed" ? (
                          <MenuItem
                            className="text-error flex items-center gap-2.5 p-2.5"
                            onClick={() =>
                              navigate(`/user/view-order/${order._id}`)
                            }
                          >
                            <img src={AddComment} alt="cancelOrderIcon" />
                            <span className="text-base font-normal leading-[26px] text-[#212121]">
                              Add Comment
                            </span>
                          </MenuItem>

                        ) : (
                          <>
                            <MenuItem
                              className="text-error flex items-center gap-2.5 p-2.5"
                              onClick={() => handleInitiateCancelOrder(order)}
                              disabled={
                                isThirtyMinutesPassed(order?.createdAt)
                                  ? true
                                  : false
                              }
                            >
                              <img src={cancelOrderIcon} alt="cancelOrderIcon" />
                              <span className="text-base font-normal leading-[26px] text-[red]">
                                Cancel Order
                              </span>
                            </MenuItem>
                            <div className="absolute bottom-[23px] right-[14px]">
                              <Tooltip
                                content={
                                  <div className="w-27">
                                    <Typography
                                      variant="small"
                                      color="white"
                                      className="font-normal opacity-70 "
                                    >
                                      You can cancel the order within 30 mins
                                    </Typography>
                                  </div>
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  className="h-5 w-5 cursor-pointer text-blue-gray-500"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                                  />
                                </svg>
                              </Tooltip>
                            </div>
                          </>
                        )}
                      </MenuList>
                    </Menu>
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

      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        orderId={deleteOrderId}
        modelTitle={"Orders"}
      />

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancelOrder}
        orderId={cancelOrderId}
        loading={cancelLoading}
      />

      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
};

export default OrdersList;
