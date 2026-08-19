export const formatDate = (dateString) => {
  const date = new Date(dateString);

  // For today's date, show "Today" with time
  // const today = new Date();
  // if (date.toDateString() === today.toDateString()) {
  //   return `Today ${date.getHours().toString().padStart(2, "0")}:${date
  //     .getMinutes()
  //     .toString()
  //     .padStart(2, "0")}`;
  // }

  // For other dates, show month and day
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
};

// yyyy-mm-dd
export const formatAPIDate = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// format dd/mm/yyyy
export const formatPickerDate = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
};

export const statusProductClass = {
  "Pending Review": "bg-[#D8F4F5] text-[#298291]",
  "In Analysis": "bg-[#cbd5e1] text-[#1e293b]",
  Approved: "bg-[#fde68a] text-[#92400e]",
  "Not Approved": "bg-[#fca5a5] text-[#D32F2F]",
  Ordered: "bg-[#bef264] text-[#3f6212]",
  "In Transit": "bg-[#8e9de8] text-[#5b21b6]",
  Received: "bg-[#5eead4] text-[#115e59]",
  Completed: "bg-[#dfe58b] text-[#848d05]",
  // Return: "bg-[#efdfbc] text-[#c78d0c]",
  "Issue (RMA)": "bg-[#c4b5fd] text-[#5b21b6]",
  Cancelled: "bg-[#fca5a5] text-[#D32F2F]",
};

export const statusProductOptions = [
  { value: "Pending Review", label: "Pending Review" },
  { value: "In Analysis", label: "In Analysis" },
  { value: "Approved", label: "Approved" },
  { value: "Not Approved", label: "Not Approved" },
  { value: "Ordered", label: "Ordered" },
  { value: "In Transit", label: "In Transit" },
  { value: "Received", label: "Received" },
  { value: "Completed", label: "Completed" },
  // { value: "Return", label: "Return" },
  { value: "Issue (RMA)", label: "Issue (RMA)" },
  { value: "Cancelled", label: "Cancelled" },
];

export const statusOrderClass = {
  "Pending Assignment": "bg-[#D8F4F5] text-[#298291]",
  "In Processing": "bg-[#D8F4] text-gray-600",
  "In Analysis": "bg-[#cbd5e1] text-[#1e293b]",
  "Partially Approved": "bg-[#FFF2C5] text-[#E27100]",
  Approved: "bg-[#fde68a] text-[#92400e]",
  "Not Approved": "bg-[#fca5a5] text-[#D32F2F]",
  Ordered: "bg-[#bef264] text-[#3f6212]",
  Completed: "bg-[#dfe58b] text-[#848d05]",
  "Issue (RMA)": "bg-[#c4b5fd] text-[#5b21b6]",
  Cancelled: "bg-[#fca5a5] text-[#D32F2F]",
};

export const statusOrderOptions = [
  { value: "Pending Assignment", label: "Pending Assignment" },
  { value: "In Analysis", label: "In Analysis" },
  { value: "Partially Approved", label: "Partially Approved" },
  { value: "Approved", label: "Approved" },
  { value: "Not Approved", label: "Not Approved" },
  { value: "Ordered", label: "Ordered" },
  { value: "In Processing", label: "In Processing" },
  { value: "Completed", label: "Completed" },
  { value: "Issue (RMA)", label: "Issue (RMA)" },
  { value: "Cancelled", label: "Cancelled" },
];

export const getStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const subtractDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return getStartOfDay(d);
};
