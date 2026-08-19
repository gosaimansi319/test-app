import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CalendarIcon from "../../assets/svg/CalendarIcon.svg";

const DateRangePicker = ({ value = [null, null], onChange }) => {
  const [startDate, endDate] = value;

  const handleChange = (dates) => {
    if (onChange) {
      onChange(dates);
    }
  };

  return (
    <div className="p-1.5 px-2.5 w-full border border-solid border-[#D1D1D1] rounded-[10px] flex min-h-10 items-center">
      <DatePicker
        className="w-52 focus:outline-none focus:border-none"
        selected={startDate}
        onChange={handleChange}
        startDate={startDate}
        endDate={endDate}
        selectsRange
        maxDate={new Date()}
        placeholderText="Select date range"
      />
      <img src={CalendarIcon} alt="CalendarIcon" />
    </div>
  );
};

export default DateRangePicker;
