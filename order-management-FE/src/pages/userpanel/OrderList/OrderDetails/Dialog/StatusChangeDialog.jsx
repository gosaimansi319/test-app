import { useState } from "react";
import { Dialog } from "@material-tailwind/react";
import Select from "react-select";

const StatusChangeDialog = ({
  open,
  handleOpen,
  onStatusChange,
  dialogType,
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("");
  const [files, setFiles] = useState(null);
  const [reasonReturn, setReasonReturn] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState(null);

  const handleStatusChange = (selectedOption) => {
    setStatus(selectedOption?.value || "");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB

      if (file?.size > maxSizeInBytes) {
        setFileError("File size should be less than 2MB");
        return;
      } else {
        setFileError(null);
      }

      // Handle all file types
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
      setFiles(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSizeInBytes) {
        setFileError("File size should be less than 2MB");
        e.target.value = null;
        return;
      } else {
        setFileError(null);
      }

      // Handle all file types
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
      setFiles(file);
    }
  };

  const handleBrowseClick = () => {
    document.getElementById("file-upload").click();
  };

  const handleRemoveFile = () => {
    setFiles(null);
    setPreviewUrl(null);
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return (
          <svg
            className="w-8 h-8 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "doc":
      case "docx":
        return (
          <svg
            className="w-8 h-8 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "xls":
      case "xlsx":
        return (
          <svg
            className="w-8 h-8 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-8 h-8 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = () => {
    if (dialogType === "changeStatus") {
      onStatusChange(status, files, dialogType);
    } else {
      if (reasonReturn.trim() === "") return;
      onStatusChange(reasonReturn, files, dialogType);
    }
    setFiles(null);
    setPreviewUrl(null);
    setStatus("Completed");
    handleOpen();
  };

  const availableStatuses = [
    { value: "Completed", label: "Order Received" },
    // { value: "Issue (RMA)", label: "Return/Replace" },
    // { value: "Return", label: "Return" },
    // { value: "Cancelled", label: "Cancel" }
  ];

  // Custom styles for react-select
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      border: "1px solid #d1d5db",
      borderRadius: "6px",
      minHeight: "40px",
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      "&:hover": {
        borderColor: "#9ca3af",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
        ? "#eff6ff"
        : "white",
      color: state.isSelected ? "white" : "#374151",
      "&:hover": {
        backgroundColor: state.isSelected ? "#3b82f6" : "#eff6ff",
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  return (
    <Dialog open={open} handler={handleOpen}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 px-4">
        <div className="boxShadow p-0 max-w-[500px] w-full max-h-[90vh] overflow-auto custom-scrollbar bg-white rounded-lg">
          {/* Header */}
          <div className="w-full p-5 flex items-center justify-between border-b border-gray-100">
            <h2 className="text-xl text-[#212121] leading-[30px] font-medium">
              {dialogType === "changeStatus"
                ? "Change Status"
                : "Request Return"}
            </h2>
            <button
              onClick={() => {
                handleOpen();
                setFiles(null);
                setPreviewUrl(null);
                setFileError(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          {/* Body */}
          <div className="flex flex-col gap-2.5 px-5 pb-5">
            <p className="text-base leading-[26px] text-[#212121]">
              {dialogType === "changeStatus"
                ? "To close the order, attach the shipping receipt or related document."
                : `To return, add the below details.`}
            </p>

            {dialogType === "changeStatus" ? (
              <div className="mb-2">
                <label className="formField-label block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={availableStatuses.find(
                    (option) => option.value === status
                  )}
                  onChange={handleStatusChange}
                  options={availableStatuses}
                  styles={customSelectStyles}
                  placeholder="Select status..."
                  isSearchable={false}
                  className="react-select-container"
                  classNamePrefix="react-select"
                />
              </div>
            ) : (
              <div>
                <label className="formField-label block text-sm font-medium text-gray-700 mb-1">
                  Reason for return <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="urgencyReason"
                  placeholder="Add your reason here"
                  value={reasonReturn}
                  onChange={(e) => {
                    const sanitizedValue = e.target.value.replace(
                      /[^a-zA-Z0-9\s]/g,
                      ""
                    );
                    setReasonReturn(sanitizedValue);
                  }}
                  rows={4}
                  className="formField-textField outline-none w-full border rounded-md p-1 text-black placeholder:text-sm placeholder:text-gray-700"
                />
              </div>
            )}

            <div>
              <label className="formField-label block text-sm font-medium text-gray-700">
                Attachments
              </label>

              {/* File upload area */}
              <div
                className={`min-h-[80px] border rounded-[10px] border-dashed mt-[10px] py-5 px-3 transition-colors duration-200 ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                } `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {!files && !previewUrl ? (
                  <div className="flex flex-wrap items-center gap-2.5 justify-center">
                    <span className="text-sm font-normal text-[#212121] leading-6 flex items-center gap-2.5">
                      <span className="h-10 w-10 bg-[#F6F6F6] flex justify-center items-center rounded-[10px]">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </span>
                      Drop files and images here, or
                    </span>
                    <button
                      type="button"
                      className="cursor-pointer text-sm text-[#282828] underline hover:text-blue-800"
                      onClick={handleBrowseClick}
                    >
                      Browse
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="*/*"
                        onChange={handleFileChange}
                      />
                    </button>
                  </div>
                ) : (
                  <div className="mt-4">
                    {previewUrl && files?.type?.startsWith("image/") ? (
                      // Image preview
                      <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-80"
                          title="Remove file"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      // File name display for non-images
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
                        {getFileIcon(files?.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {files?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(files?.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Remove file"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {fileError && (
                <div className="text-red-500 text-sm mt-2">{fileError}</div>
              )}
            </div>
          </div>

          <div className="flex justify-end p-5 gap-5 border-t border-[#E7E7E7]">
            <button
              className="formField-btn px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              onClick={() => {
                handleOpen();
                setFiles(null);
                setPreviewUrl(null);
                setFileError(null);
              }}
            >
              Cancel
            </button>
            <button
              className="formField-btn bg-[#3D3D3D] text-[#FFFFFF] px-4 py-2 rounded-md hover:bg-gray-800"
              onClick={handleSubmit}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default StatusChangeDialog;
