import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPriceHistory,
  getOrdersByProductId,
} from "../../../../store/Orders/ordersThunk";
import Pagination from "../../../../components/commen/Pagination";
import { statusOrderClass } from "../../../../utils/utilities";
import { useLocation, useNavigate } from "react-router-dom";
import Arrow from "../../../../assets/svg/arrow-left.svg";

const OrderHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { product_id } = location.state;

  // Orders pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  // Price History pagination states
  const [priceHistoryPage, setPriceHistoryPage] = useState(1);
  const [priceHistoryPerPage, setPriceHistoryPerPage] = useState(5);
  const [totalPriceHistoryItems, setTotalPriceHistoryItems] = useState(0);

  const { productOrders, loading, priceHistoryLoading, priceHistory } =
    useSelector((state) => state.order);

  // Fetch orders data
  useEffect(() => {
    dispatch(
      getOrdersByProductId({
        page: currentPage,
        limit: itemsPerPage,
        product_id,
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
  }, [dispatch, currentPage, itemsPerPage, product_id]);

  // Fetch price history data
  useEffect(() => {
    dispatch(
      fetchPriceHistory({
        page: priceHistoryPage,
        limit: priceHistoryPerPage,
        product_id,
      })
    )
      .then((res) => {
        if (res.payload) {
          if (res.payload.pagination) {
            setTotalPriceHistoryItems(res.payload.pagination.total_items);
          }
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [dispatch, priceHistoryPage, priceHistoryPerPage, product_id]);

  // Orders pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  // Price History pagination handlers
  const handlePriceHistoryPageChange = (page) => {
    setPriceHistoryPage(page);
  };

  const handlePriceHistoryLimitChange = (limit) => {
    setPriceHistoryPerPage(limit);
    setPriceHistoryPage(1);
  };

  return (
    <div>
      <div className="boxShadow md:hidden">
        <h2 className="flex sm:hidden text-2xl font-bold text-[#212121] leading-9">
          <img
            onClick={() => navigate(-1)}
            src={Arrow}
            alt="Arrow"
            className="cursor-pointer"
          />
          &nbsp;Order History
        </h2>
      </div>
      <div>
        <h2 className="text-lg font-bold text-[#212121] leading-9 mb-2">
          Product ID: {product_id}
        </h2>
      </div>
      <div className="boxShadow">
        <h3 className="block text-2xl font-bold text-[#212121] leading-9">
          Product Order History
        </h3>

        <div className="mt-5 custom-scrollbar max-h-[310px]">
          <table className="table min-w-[1600px] lg:w-full border-separate border-spacing-0 table-zebra">
            <thead className="sticky top-0 bg-base-200 z-10">
              <tr>
                <th className="table-title bg-white">Order ID</th>
                <th className="table-title bg-white">Company</th>
                <th className="table-title bg-white">Department</th>
                <th className="table-title bg-white">Center Cost</th>
                <th className="table-title bg-white">Created By</th>
                <th className="table-title bg-white">Role</th>
                <th className="table-title bg-white">Quantity</th>
                <th className="table-title bg-white">Status</th>
                <th className="table-title bg-white">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <tr>
                    <td colSpan="15" className="text-center py-5 text-gray-500">
                      <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-4 border-gray-600 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                </>
              ) : productOrders && productOrders.length > 0 ? (
                productOrders?.map((order) => (
                  <tr
                    key={order._id}
                    className="relative border-b border-[#E7E7E7]"
                  >
                    <td className="table-data">{order.order_id}</td>
                    <td className="table-data">{order.company_name}</td>
                    <td className="table-data">{order.department_name}</td>
                    <td className="table-data">{order.center_cost_name}</td>
                    <td className="table-data">
                      {order.created_by?.name || "-"}
                    </td>
                    <td className="table-data">
                      {order.created_by?.role || "-"}
                    </td>
                    <td className="table-data">{order.quantity}</td>
                    <td className="table-data">
                      <div
                        className={`inline-block py-[2px] px-2.5 rounded-full text-xs font-medium leading-[22px] ${
                          statusOrderClass[order.status]
                        }`}
                      >
                        {order.status}
                      </div>
                    </td>
                    <td className="table-data">
                      {new Date(order.createdAt).toLocaleDateString()}
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

        <Pagination
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>
      <br />
      <div className="boxShadow">
        <h3 className="block text-2xl font-bold text-[#212121] leading-9">
          Product Price History
        </h3>

        <div className="mt-5 custom-scrollbar max-h-[310px]">
          <table className="table min-w-[1600px] lg:w-full border-separate border-spacing-0 table-zebra">
            <thead className="sticky top-0 bg-base-200 z-10">
              <tr>
                <th className="table-title bg-white">Date</th>
                <th className="table-title bg-white">Supplier</th>
                <th className="table-title bg-white">Previous Price</th>
                <th className="table-title bg-white">Updated Price</th>
                <th className="table-title bg-white">Updated By</th>
              </tr>
            </thead>
            <tbody>
              {priceHistoryLoading ? (
                <>
                  <tr>
                    <td colSpan="15" className="text-center py-5 text-gray-500">
                      <div className="flex items-center justify-center py-10">
                        <div className="w-8 h-8 border-4 border-gray-600 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                </>
              ) : priceHistory &&
                priceHistory?.updated_suppliers?.length > 0 ? (
                priceHistory?.updated_suppliers?.map((item, i) => (
                  <tr key={i} className="relative border-b border-[#E7E7E7]">
                    <td className="table-data">
                      {new Date(item?.supplier?.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="table-data">
                      {item?.supplier?.company_name}
                    </td>
                    <td className="table-data">${item?.previous_price}</td>
                    <td className="table-data">${item?.price}</td>
                    <td className="table-data">{item?.updated_by?.name}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="15" className="text-center py-5 text-gray-500">
                    No price history data present
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalItems={totalPriceHistoryItems}
          itemsPerPage={priceHistoryPerPage}
          currentPage={priceHistoryPage}
          onPageChange={handlePriceHistoryPageChange}
          onLimitChange={handlePriceHistoryLimitChange}
        />
      </div>
    </div>
  );
};

export default OrderHistory;
