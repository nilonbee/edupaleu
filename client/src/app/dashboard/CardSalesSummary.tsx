import { useGetDashboardMetricsQuery } from "@/state/api";
import { TrendingUp } from "lucide-react";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CardSalesSummary = () => {
  const { data, isLoading, isError } = useGetDashboardMetricsQuery();
  const salesData = data?.salesSummary || [];

  const totalEnquiries = Math.floor(
    salesData.reduce((acc, curr) => acc + curr.totalValue, 0) || 0
  );

  // Calculate average change (comparing last month to previous)
  const averageChangePercentage =
    salesData.length >= 2
      ? ((salesData[salesData.length - 1].totalValue - salesData[salesData.length - 2].totalValue) /
          (salesData[salesData.length - 2].totalValue || 1)) * 100
      : 0;

  const highestValueData = salesData.reduce((acc, curr) => {
    return acc.totalValue > curr.totalValue ? acc : curr;
  }, salesData[0] || {});

  const highestValueDate = highestValueData.date
    ? new Date(highestValueData.date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "N/A";

  if (isError) {
    return <div className="m-5">Failed to fetch data</div>;
  }

  return (
    <div className="row-span-3 xl:row-span-6 bg-white shadow-md rounded-2xl flex flex-col justify-between">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          {/* HEADER */}
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-2 px-4 md:px-7 pt-3 md:pt-5">
              Enquiries Summary
            </h2>
            <hr />
          </div>

          {/* BODY */}
          <div>
            {/* BODY HEADER */}
            <div className="flex justify-between items-center mb-4 md:mb-6 px-4 md:px-7 mt-3 md:mt-5">
              <div className="text-base md:text-lg font-medium">
                <p className="text-xs text-gray-400">Total Enquiries</p>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xl md:text-2xl font-extrabold">
                    {totalEnquiries.toLocaleString("en")}
                  </span>
                  {averageChangePercentage !== 0 && (
                    <span className={`text-xs md:text-sm ${averageChangePercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <TrendingUp className="inline w-3 h-3 md:w-4 md:h-4 mr-1" />
                      {Math.abs(averageChangePercentage).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* CHART */}
            <ResponsiveContainer width="100%" height={280} className="px-2 md:px-7">
              <BarChart
                data={salesData}
                margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                    });
                  }}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(value) => {
                    return value.toString();
                  }}
                  tick={{ fontSize: 10, dx: -1 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value} enquiries`,
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    });
                  }}
                />
                <Bar
                  dataKey="totalValue"
                  fill="#3182ce"
                  barSize={8}
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* FOOTER */}
          <div>
            <hr />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-4 md:mt-6 text-xs md:text-sm px-4 md:px-7 mb-3 md:mb-4">
              <p>{salesData.length || 0} months</p>
              <p className="text-xs md:text-sm">
                Highest Month:{" "}
                <span className="font-bold">{highestValueDate}</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CardSalesSummary;
