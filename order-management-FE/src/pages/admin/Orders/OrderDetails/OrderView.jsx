import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getOrderById } from "../../../../store/Orders/ordersThunk";
import { useState } from "react";
import PageLoader from "../../../../components/commen/PageLoader";
import { statusProductClass } from "../../../../utils/utilities";
import Arrow from '../../../../assets/svg/arrow-left.svg';
const OrderView = () => {
  const location = useLocation();
  const baseRoute = location.pathname.split("/")[1];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setloading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    setloading(true);
    dispatch(getOrderById(orderId))
      .then((result) => {
        setSelectedOrder(result.payload);
        setProducts(result.payload.products);
      })
      .then(() => setloading(false));
  }, [dispatch, orderId]);

  return (
    <div className="boxShadow min-h-[100%]">
      {loading ? (
        <PageLoader />
      ) : (
        <>
         <h2 className="flex sm:hidden text-2xl font-bold text-[#212121] leading-9 mb-3">
        <img
          onClick={() => navigate(-1)}
          src={Arrow}
          alt="Arrow"
          className="cursor-pointer"
        />
        &nbsp;View Order
      </h2>
          <h3 className="font-semibold py-3 my-3">
            Order ID: {selectedOrder?.order_id}
          </h3>
          <h3 className="font-semibold py-3 my-3">Ordered Products</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {products.map((product, index) => (
              <div key={index}>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-6">
                    <div className="flex justify-center md:justify-start md:order-1">
                      <img
                        className="w-28 h-28 object-cover rounded-xl"
                        src={product?.image}
                        alt="product"
                      />
                    </div>

                    <div className="mt-4 md:mt-0 flex-1 space-y-2 md:order-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Name:{" "}
                        <span className="font-normal">
                          {product?.product_name}
                        </span>
                      </p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Quantity:{" "}
                        <span className="font-normal">{product?.quantity}</span>
                      </p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Brand:{" "}
                        <span className="font-normal">
                          {product?.brand_name}
                        </span>
                      </p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Status:
                        <span
                          className={`ml-2 inline-flex items-center px-2 py-1 text-xs font-normal rounded-full ${
                            statusProductClass[product.status]
                          }`}
                        >
                          {product?.status}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 md:mt-0 md:order-3 flex justify-center md:justify-end">
                      <button
                        onClick={() =>
                          navigate(`/${baseRoute}/order-details/${orderId}`, {
                            state: { product },
                          })
                        }
                        className="px-5 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OrderView;
