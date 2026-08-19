import { Dialog } from "@material-tailwind/react";

export function AlertDialog({ open, handleOpen, handleConfirmCancel }) {
  return (
    <div>
      <Dialog
        className="w-[800px] max-w-[800px]"
        open={open}
        handler={handleOpen}
      >
        {/* <DialogHeader>Its a simple dialog.</DialogHeader> */}
        <p className="text-center text-gray-700 mt-3">
          Are you sure you want to cancel without saving all changes?
        </p>
        <div className="flex gap-7 justify-center my-6">
          <button className="formField-btn" onClick={handleOpen}>
            Cancel
          </button>
          <button
            className="formField-btn bg-[#3D3D3D] text-[#FFFFFF]"
            onClick={handleConfirmCancel}
          >
            Confirm
          </button>
        </div>
      </Dialog>
    </div>
  );
}
