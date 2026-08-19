import { useEffect, useState } from "react";
import { formatAPIDate, getStartOfDay, subtractDays } from "../../../utils/utilities";
import { chart2Data } from "../../../Api/dashboard";
import DateRangePicker from "../../../components/commen/DateRangePicker";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Label,
} from "recharts";

const COLORS = ["#83D6DD", "#FFE585", "#6BBD6E"];

const OrderStatusChart = () => {
  const today = getStartOfDay(new Date());
  const defaultRangeChart1And2 = [subtractDays(today, 7), today];

  const [dateRange, setDateRange] = useState(defaultRangeChart1And2);
  const [chartData, setChartData] = useState([]);

  const fetchChartData = async (start_date, end_date) => {
    const res = await chart2Data(start_date, end_date);
    if (res?.status_code === 200)
      setChartData([
        {
          name: "Pending",
          value: res?.data?.status_summary?.["Pending Assignment"],
        },
        { name: "Approved", value: res?.data?.status_summary?.Approved },
        { name: "Shipped", value: res?.data?.status_summary?.["Completed"] },
      ]);
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
          Order Status
        </h6>
        <div>
          <DateRangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </div>
      <div className="">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart height={230}>
            <Pie
              dataKey="value"
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={85}
              outerRadius={110}
              label
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  radius={20}
                />
              ))}
              <Label
                value={`Total Orders: ${chartData.reduce(
                  (sum, item) => sum + item.value,
                  0
                )}`}
                position="center"
                style={{
                  fontSize: "16px",
                  fontWeight: "normal",
                }}
              />
        
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex items-center flex-wrap justify-center md:justify-end md:gap-2">
          {chartData.map((entry, index) => (
            <div
              key={`legend-${index}`}
              className="py-2 px-3 flex items-center gap-3"
            >
              <div
                className="h-4 w-4"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-sm font-normal text-[#212121] leading-6">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderStatusChart;