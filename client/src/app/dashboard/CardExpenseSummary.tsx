import {
  ExpenseByCategorySummary,
  useGetDashboardMetricsQuery,
} from "@/state/api";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useEffect } from "react";

type ExpenseSums = {
  [category: string]: number;
};

const colors = [
  "#00C49F", 
  "#0088FE", 
  "#FFBB28", 
  "#FF8042", 
  "#8884D8", 
  "#82CA9D", 
  "#FFC658",
  "#FF6B6B",
  "#4ECDC4",
  "#95E1D3"
];

const CardExpenseSummary = () => {
  const { data: dashboardMetrics, isLoading } = useGetDashboardMetricsQuery();
  const [isMdScreen, setIsMdScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMdScreen(window.innerWidth >= 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  const statusData = Object.entries(statusCounts)
    .map(([name, value]) => ({
      name,
      value: Math.floor(value),
    }))
    .sort((a, b) => b.value - a.value); // Sort by count descending

  const totalApplications = Math.floor(
    statusData.reduce((acc, status: { value: number }) => acc + status.value, 0)
  );

  return (
    <div className="row-span-3 bg-white shadow-md rounded-2xl flex flex-col justify-between">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          {/* HEADER */}
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-2 px-4 md:px-7 pt-3">
              Application Status Summary
            </h2>
            <hr />
          </div>
          {/* BODY */}
          <div className="px-4 md:px-7 py-3 flex flex-col flex-1 min-h-0">
            {/* CHART */}
            <div className="relative w-full flex justify-center items-center flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={isMdScreen ? "38%" : "40%"}
                    outerRadius={isMdScreen ? "63%" : "65%"}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    paddingAngle={2}
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} applications`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="font-bold text-xl md:text-2xl block">
                  {totalApplications}
                </span>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          {/* FOOTER */}
          <div>
            <hr />
            <div className="px-4 md:px-7 py-2">
              <p className="text-xs text-gray-500 text-center">
                Hover over the chart to see status details
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardExpenseSummary;
