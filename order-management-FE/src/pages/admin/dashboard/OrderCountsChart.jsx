import { useEffect, useState } from "react";
import { formatAPIDate, formatDate, getStartOfDay, subtractDays } from "../../../utils/utilities";
import { chart1Data } from "../../../Api/dashboard";
import DateRangePicker from "../../../components/commen/DateRangePicker";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

const COLORS = ["#83D6DD", "#FFE585", "#6BBD6E"];

const OrderCountsChart = () => {
  const today = getStartOfDay(new Date());
  const defaultRangeChart1And2 = [subtractDays(today, 7), today];

  const [dateRange, setDateRange] = useState(defaultRangeChart1And2);
  const [chartData, setChartData] = useState([]);

  const fetchChartData = async (start_date, end_date) => {
    const res = await chart1Data(start_date, end_date);
    if (res?.status_code === 200)
      setChartData(
        res?.data?.map((itm) => ({ ...itm, date: formatDate(itm.date) }))
      );
  };

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      const startDate = formatAPIDate(dateRange[0]);
      const endDate = formatAPIDate(dateRange[1]);
      fetchChartData(startDate, endDate);
    }
  }, [dateRange]);

  return (
    <div className="boxShadow mt-5">
      <div className="flex items-start gap-3 md:items-center flex-wrap flex-col md:flex-row justify-between mb-5">
        <h6 className="text-xl font-medium text-[#212121] leading-[30px]">
          Order Counts
        </h6>
        <div>
          <DateRangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={375}>
        <LineChart
          height={375}
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <XAxis dataKey="date" padding={{ left: 20, right: 20 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="Pending Assignment"
            name="Pending"
            stroke={COLORS[0]}
            strokeWidth={3}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="Approved"
            name="Approved"
            stroke={COLORS[1]}
            strokeWidth={3}
          />
          <Line
            type="monotone"
            dataKey="Completed"
            name="Shipped"
            stroke={COLORS[2]}
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OrderCountsChart;