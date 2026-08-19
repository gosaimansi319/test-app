import { Dialog } from "@material-tailwind/react";

export const CancelOrderModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  loading,
}) => {
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} handler={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        ></div>
        <div className="relative z-10 bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {orderId.order_name}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to cancel this order?
            </p>
            <div className="flex gap-4 w-full">
              <button
                className="py-2 px-4 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 w-1/2"
                onClick={onClose}
                disabled={loading}
              >
                No, Keep Order
              </button>
              <button
                className="py-2 px-4 rounded-md text-white bg-gray-800  w-1/2 flex items-center justify-center"
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin mr-2"></div>
                ) : null}
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
