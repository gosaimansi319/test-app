import React from "react";

const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onLimitChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    pages.push(1);

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (pages[pages.length - 1] !== i - 1) {
        pages.push("...");
      }
      pages.push(i);
    }

    if (totalPages > 1) {
      if (pages[pages.length - 1] !== totalPages - 1) {
        pages.push("...");
      }
      if (pages[pages.length - 1] !== totalPages) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Options for items per page dropdown
  const limitOptions = [5, 10, 15, 25, 50];

  if (totalItems < 5) {
    return <div className="flex items-center justify-center py-4"></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center md:justify-between py-4 bg-white border-t border-gray-200 sm:flex-row sticky bottom-0 z-[11] ">
      <div className="hidden md:flex items-center gap-2.5 w-full">
        <span className="text-sm font-normal text-[#212121] leading-6">
          Showing
        </span>
        <select
          className="px-2.5 py-[7px] max-w-[80px] w-full text-sm border border-[#D1D1D1] rounded-[10px] outline-none appearance-none bg-[url(/down-arrowIcon.svg)] bg-no-repeat bg-right pr-[27px] bg-[length:24px_24px]"
          value={itemsPerPage}
          onChange={(e) => onLimitChange(Number(e.target.value))}
        >
          {limitOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-sm font-normal text-[#212121] leading-6">
          out of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`rounded-md ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-[#3D1612] hover:bg-gray-100"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {getPageNumbers().map((pageNum, index) => (
          <React.Fragment key={index}>
            {pageNum === "..." ? (
              <span className="px-3 py-1 text-gray-700">...</span>
            ) : (
              <button
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 rounded-md h-5 w-5 font-normal text-xs flex items-center justify-center ${
                  currentPage === pageNum
                    ? "activebtn"
                    : "text-[#212121] hover:bg-gray-100"
                }`}
              >
                {pageNum}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-md ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
