import { useNavigate } from "react-router-dom";
import CloseIcon from "../../assets/svg/closeIcon.svg";

const OrderProductModal = ({ isOpen, onClose, products, orderId }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-[15px]">
      <div className="boxShadow p-0 max-w-[500px] w-full max-h-[90vh] overflow-auto custom-scrollbar">
        <div className="max-w-[500px] w-full p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-[#212121] leading-[30px] font-medium">
              View Order
            </h2>
            <button onClick={onClose}>
              <img src={CloseIcon} alt="CloseIcon" />
            </button>
          </div>
          <div className="space-y-4">
            {products.map((product, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-2xl shadow-md p-5 w-full transition hover:shadow-lg"
                onClick={() => navigate(`/admin/order-details/${orderId}`, { state: { product } })}
              >
                <p className="text-base text-[#212121] font-semibold mb-2">
                  Name:{" "}
                  <span className="font-normal">{product.product_name}</span>
                </p>
                <p className="text-base text-[#212121] font-semibold mb-2">
                  Quantity:{" "}
                  <span className="font-normal">{product.quantity}</span>
                </p>
                <p className="text-base text-[#212121] font-semibold">
                  Price:{" "}
                  <span className="font-normal">₹{product.supplier_price}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderProductModal;
