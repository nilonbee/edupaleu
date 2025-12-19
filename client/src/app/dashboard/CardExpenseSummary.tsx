import {
  ExpenseByCategorySummary,
  useGetDashboardMetricsQuery,
} from "@/state/api";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type ExpenseSums = {
  [category: string]: number;
};

const colors = ["#00C49F", "#0088FE", "#FFBB28", "#FF8042", "#8884D8"];

// Custom Tooltip Component to show all statuses
const CustomTooltip = ({ active, payload, allStatusData }: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
      <div className="mb-2 pb-2 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-800">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
      <div className="max-h-48 overflow-y-auto">
        <p className="text-[9px] font-semibold text-gray-700 mb-1">All Statuses:</p>
        <div className="space-y-0.5">
          {allStatusData.map((entry: any, index: number) => (
            <div
              key={`tooltip-status-${index}`}
              className="flex items-center justify-between text-[9px] text-gray-600"
            >
              <span className="truncate mr-2">{entry.name}:</span>
              <span className="font-medium text-gray-800 whitespace-nowrap">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CardExpenseSummary = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();

  const expenseByCategorySummary =
    dashboardMetrics?.expenseByCategorySummary || [];

  // Group by status (category is already the status name from backend)
  const statusCounts = expenseByCategorySummary.reduce(
    (acc: ExpenseSums, item: ExpenseByCategorySummary) => {
      const status = item.category; // This is the application status
      const count = parseInt(item.amount, 10);
      if (!acc[status]) acc[status] = 0;
      acc[status] += count;
      return acc;
    },
    {}
  );

  const allStatusData = Object.entries(statusCounts)
    .map(([name, value]) => ({
      name,
      value: Math.floor(value),
    }))
    .sort((a, b) => b.value - a.value); // Sort by count descending

  // Get top 5 statuses for display
  const statusData = allStatusData.slice(0, 5);

  // Calculate total from all statuses, not just top 5
  const totalApplications = Math.floor(
    allStatusData.reduce((acc, status: { value: number }) => acc + status.value, 0)
  );

  return (
    <div className="row-span-3 bg-white shadow-md rounded-2xl flex flex-col justify-between">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          {/* HEADER */}
          <div>
            <h2 className="text-lg font-semibold mb-2 px-7 pt-5">
              Application Status Summary
            </h2>
            <hr />
          </div>
          {/* BODY */}
          <div className="xl:flex justify-between pr-7">
            {/* CHART */}
            <div className="relative basis-3/5">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={50}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip allStatusData={allStatusData} />}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center basis-2/5">
                <span className="font-bold text-xl">
                  {totalApplications}
                </span>
              </div>
            </div>
            {/* LABELS */}
            <ul className="flex flex-col justify-around items-center xl:items-start py-5 gap-3">
              {statusData.map((entry, index) => (
                <li
                  key={`legend-${index}`}
                  className="flex items-center text-xs"
                >
                  <span
                    className="mr-2 w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></span>
                  {entry.name}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default CardExpenseSummary;

