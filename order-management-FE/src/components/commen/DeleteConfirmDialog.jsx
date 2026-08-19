import { Dialog } from "@material-tailwind/react";
import { Loader } from "./Loader";

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}) {
  return (
    <div>
      <Dialog className="w-[300px]" open={open} handler={onClose} size="sm">
        <p className="text-center text-gray-700 mt-3">
          {message}
        </p>
        <div className="flex gap-7 justify-center my-6">
          <button className="formField-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="formField-btn bg-[#3D3D3D] text-[#FFFFFF]"
            onClick={onConfirm}
          >
            {isLoading ? (
              <div className="py-1">
                <Loader />
              </div>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </Dialog>
    </div>
  );
}
