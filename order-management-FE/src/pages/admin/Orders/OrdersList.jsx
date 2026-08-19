import { useEffect, useRef, useState } from "react";
import VarticalDotIcon from "../../../assets/svg/basil_other-1-outline.svg";
import FilterButton from "../../../assets/svg/FilterButton.svg";
import viewDetailIcon from "../../../assets/svg/view-detail.svg";
import updateIcon from "../../../assets/svg/updateicons.svg";
import deleteIcon from "../../../assets/svg/delete-icon.svg";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Button,
} from "@material-tailwind/react";
import {
  bulkDeleteOrder,
  deleteOrderById,
  fetchOrders,
} from "../../../store/Orders/ordersThunk";
import Pagination from "../../../components/commen/Pagination";
import ConfirmDeleteModal from "../../../components/commen/ConfirmDeleteModal";
import OrderFilterPopup from "../../../components/commen/OrderFilterPopup";
import toast from "react-hot-toast";
import PageLoader from "../../../components/commen/PageLoader";
import { statusOrderClass } from "../../../utils/utilities";

const OrdersList = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteLoad, setDeleteLoad] = useState(false);

  // Filter states
  const [showFilter, setShowFilter] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const [filterType, setFilterType] = useState("center_cost_name");
  const [filterValue, setFilterValue] = useState("");
  const [filterValueParams,setFilterValueParams] = useState({})

  const { orders, loading } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchOrders({ page: currentPage, limit: itemsPerPage, ...filterValueParams }))
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

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  const toggleSelection = (id, order) => {
    if (selectedIds?.length === 0) {
      setDeleteOrderId(id);
      setSelectedOrder(order);
    } else {
      setDeleteOrderId(null);
    }

    if (selectedIds?.includes(id)) {
      setSelectedIds(selectedIds?.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds?.length === orders?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders?.map((order) => order._id));
    }
  };

  const handleConfirmDelete = () => {
    setDeleteLoad(true);
    const isBulkDelete =
      selectedIds?.length > 1 && selectedIds?.length === orders.length;
    const idsToDelete = deleteOrderId ? [deleteOrderId] : selectedIds;

    if (isBulkDelete && !filterApplied) {
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
        })
        .then(() => setDeleteLoad(false))
        .catch((error) => {
          console.error("Bulk delete failed:", error);
          toast.error("Failed to delete orders");
          setDeleteLoad(false);
        });
    } else {
      Promise.all(idsToDelete?.map((id) => dispatch(deleteOrderById(id))))
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
            toast.success("Orders deleted successfully");
          });
        })
        .then(() => setDeleteLoad(false))
        .catch((error) => {
          console.error("Delete failed:", error);
          toast.error("Failed to delete orders");
          setDeleteLoad(false);
        });
    }
  };

  const handleApplyFilter = (filterData) => {
    setShowFilter(false); // Hide the filter popup

    const filterParams = {
      page: 1,
      limit: itemsPerPage,
      orderStatus: filterData?.status,
      date: filterData?.date,
      [filterType]: filterValue,
    };

    setFilterValueParams({
      orderStatus: filterData?.status,
      date: filterData?.date,
      [filterType]: filterValue
    });

    dispatch(fetchOrders(filterParams)).then((res) => {
      if (res.payload?.pagination) {
        setFilterApplied(true);
        setTotalItems(res.payload.pagination.total_items);
        setCurrentPage(1);
      }
    });
  };

  const handleRemoveFilter = () => {
    setShowFilter(false);
        setFilterValueParams({})
    const defaultParams = {
      page: 1,
      limit: itemsPerPage,
    };


    dispatch(fetchOrders(defaultParams)).then((res) => {
      if (res.payload?.pagination) {
        setFilterApplied(false);
        setTotalItems(res.payload.pagination.total_items);
        setCurrentPage(1);
      }
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

  return (
    <div className="boxShadow">
      <h3 className="block sm:hidden text-2xl font-bold text-[#212121] leading-9">
        Order List
      </h3>

      <div className="flex items-center justify-between gap-5 pt-5 md:justify-end sm:pt-0">
        {selectedIds?.length > 0 && (
          <button
            className="formField-btn flex gap-[10px]"
            onClick={() => setShowDeleteModal(true)}
          >
            <img src={deleteIcon} alt="deleteIcon" /> ({selectedIds?.length})
          </button>
        )}
        <button
          className="formField-btn"
          onClick={() => navigate("/admin/create-order")}
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
            setFilterType={setFilterType}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
            onApply={handleApplyFilter}
            onClear={handleRemoveFilter}
            onClose={() => setShowFilter(false)}
          />
        </span>
      </div>

      <div className="mt-5 custom-scrollbar">
        <table className="table min-w-[1600px] lg:w-full border-separate border-spacing-0 table-zebra">
          <thead className="sticky top-0 bg-base-200">
            <tr>
              <th className="w-10 px-2 py-3 text-left">
                <input
                  id="checkbox"
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    orders?.length > 0 && selectedIds?.length === orders?.length
                  }
                />
              </th>
              <th className="table-title font-bold">Order ID</th>
              <th className="table-title font-bold text-nowrap">Client</th>
              {/* <th className="table-title font-bold">Company</th>
              <th className="table-title font-bold">Department</th> */}
              <th className="table-title font-bold">Center Cost</th>
              <th className="table-title font-bold">Manager</th>
              <th className="table-title font-bold text-nowrap">Is Urgent?</th>
              <th className="table-title font-bold">Date</th>
              <th className="table-title font-bold">Status</th>
              <th className="table-title font-bold">Approved</th>
              <th className="table-title font-bold text-nowrap">
                Not Approved
              </th>
              <th className="table-title font-bold text-nowrap">In Analysis</th>
              <th className="table-title font-bold md:sticky md:right-0 md:bg-white md:z-10 md:border-l md:border-[#E7E7E7] md:border-b">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <tr>
                  <td colSpan="15" className="text-center py-5 text-gray-500">
                    <PageLoader />
                  </td>
                </tr>
              </>
            ) : orders && orders?.length > 0 ? (
              orders?.map((order) => (
                <tr
                  key={order?._id}
                  className="relative border-b border-[#E7E7E7]"
                >
                  <td className="py-4 pl-2.5 pr-[14px] border-b border-[#E7E7E7] text-start">
                    <input
                      id="checkbox"
                      type="checkbox"
                      className="rounded"
                      onChange={() => toggleSelection(order?._id, order)}
                      checked={selectedIds?.includes(order?._id)}
                    />
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {order?.order_id}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {order?.created_by?.name || "-"}
                  </td>
                  {/* <td className="table-data whitespace-nowrap">
                    {order?.company_name}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {order?.department_name}
                  </td> */}
                  <td className="table-data whitespace-nowrap">
                    {order?.center_cost_name}
                  </td>
                   <td className="table-data whitespace-nowrap">
                    {order?.updated_by?.name || "unassigned"}
                  </td>
                  <td className="table-data whitespace-nowrap">
                    {order?.urgent ? "Yes" : "No"}
                  </td>

                  <td className="table-data whitespace-nowrap">
                    {new Date(order?.createdAt).toLocaleDateString()}
                  </td>
                   <td className="table-data whitespace-nowrap">
                    <div
                      className={`inline-block py-[2px] px-2.5 rounded-full text-xs font-medium leading-[22px] ${
                        statusOrderClass[order.orderStatus]
                      }`}
                    >
                      {order.orderStatus}
                    </div>
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
                            navigate(`/admin/view-order/${order?._id}`);
                          }}
                        >
                          <img src={viewDetailIcon} alt="viewDetailIcon" />
                          <span className="text-base font-normal leading-[26px] text-[#212121]">
                            View Order
                          </span>
                        </MenuItem>
                        <MenuItem
                          className="text-error flex items-center gap-2.5 p-2.5"
                          onClick={() => {
                            navigate(`/admin/update-order/${order?._id}`, {
                              state: { orderId: order?._id },
                            });
                            setOpenDropdown(false);
                          }}
                        >
                          <img src={updateIcon} alt="updateIcon" />
                          <span className="text-base font-normal leading-[26px] text-[#212121]">
                            Update Order
                          </span>
                        </MenuItem>
                        {/* <MenuItem
                          className="text-error flex items-center gap-2.5 p-2.5"
                          onClick={() =>
                            navigate("/admin/order-history", {
                              state: { product_id: order?._id },
                            })
                          }
                        >
                          <img src={historyIcon} alt="historyIcon" />
                          <span className="text-base font-normal leading-[26px] text-[#212121]">
                            View History
                          </span>
                        </MenuItem> */}
                        <MenuItem
                          className="text-error flex items-center gap-2.5 p-2.5"
                          onClick={() => {
                            setDeleteOrderId(order?._id);
                            setSelectedOrder(order);
                            setShowDeleteModal(true);
                            toggleDropdown(null);
                          }}
                        >
                          <img src={deleteIcon} alt="deleteIcon" />
                          <span className="text-base font-normal leading-[26px] text-[red]">
                            Delete Order
                          </span>
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="15" className="text-center py-5 text-gray-500">
                  No data present
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        orderId={deleteOrderId}
        deleteLoading={deleteLoad}
        showId={selectedOrder?.order_id}
        modelTitle={"Order"}
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
