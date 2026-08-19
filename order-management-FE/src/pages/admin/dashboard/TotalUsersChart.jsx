import { useEffect, useState } from "react";
import { formatAPIDate, formatDate, getStartOfDay, subtractDays } from "../../../utils/utilities";
import { chart3Data } from "../../../Api/dashboard";
import DateRangePicker from "../../../components/commen/DateRangePicker";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

const COLORS = ["#83D6DD", "#FFE585"];

const TotalUsersChart = () => {
  const today = getStartOfDay(new Date());
  const yesterday = subtractDays(today, 1);
  const defaultRangeChart3 = [subtractDays(today, 7), yesterday];


  const [dateRange, setDateRange] = useState(defaultRangeChart3);
  const [chartData, setChartData] = useState([]);

  const fetchChartData = async (start_date, end_date) => {
    const res = await chart3Data(start_date, end_date);
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
    <div className="boxShadow w-full xl:w-1/2 overflow-hidden">
      <div className="flex items-start gap-3 sm:items-center flex-wrap flex-col sm:flex-row justify-between mb-5">
        <h6 className="text-xl font-medium text-[#212121] leading-[30px]">
          Total Users
        </h6>
        <div>
          <DateRangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </div>
      <ResponsiveContainer width="100%" height={330}>
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: -15,
            bottom: 30,
          }}
        >
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: 20 }}
          />
          <Bar
            dataKey="active"
            fill={COLORS[0]}
            activeBar={false}
            name="Active"
            radius={[14, 14, 0, 0]}
          />
          <Bar
            dataKey="inactive"
            fill={COLORS[1]}
            activeBar={false}
            name="Inactive"
            radius={[14, 14, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TotalUsersChart;