import CloseIcon from "../../assets/svg/closeIcon.svg";
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, orderId }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-[15px]">
      <div className="boxShadow p-0 max-w-[500px] w-full max-h-[90vh] overflow-auto custom-scrollbar">
        <div className="max-w-[500px] w-full p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-[#212121] leading-[30px] font-medium">
              Delete Order
            </h2>
            <button onClick={onClose}>
              <img src={CloseIcon} alt="CloseIcon" />
            </button>
          </div>
          <div className="flex flex-col gap-2.5 mt-5">
            <p className="text-base text-[#212121] font-normal leading-[26px]">
              Order ID: <span className="text-[#6D6D6D] ml-2.5">{orderId}</span>
            </p>
            <p className="text-base text-[#212121] font-normal leading-[26px]">
              Are you sure you want to delete this order?
            </p>
          </div>
        </div>
        <div className="flex justify-end p-5 gap-5 border-t border-[#E7E7E7]  ">
          <button
            className="formField-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="formField-btn bg-[#3D3D3D] text-[#FFFFFF]"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
export default ConfirmDeleteModal;
