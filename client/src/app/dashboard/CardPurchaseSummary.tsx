import { useGetDashboardMetricsQuery } from "@/state/api";
import { TrendingDown, TrendingUp } from "lucide-react";
import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CardPurchaseSummary = () => {
  const { data, isLoading } = useGetDashboardMetricsQuery();
  const purchaseData = data?.purchaseSummary || [];

  const lastDataPoint = purchaseData[purchaseData.length - 1] || null;
  const previousDataPoint = purchaseData[purchaseData.length - 2] || null;
  
  const totalConversions = Math.floor(
    purchaseData.reduce((acc, curr) => acc + curr.totalPurchased, 0) || 0
  );
  
  const changePercentage = lastDataPoint && previousDataPoint && previousDataPoint.totalPurchased > 0
    ? ((lastDataPoint.totalPurchased - previousDataPoint.totalPurchased) / previousDataPoint.totalPurchased) * 100
    : 0;

  return (
    <div className="flex flex-col justify-between row-span-2 xl:row-span-3 col-span-1 md:col-span-2 xl:col-span-1 bg-white shadow-md rounded-2xl">
      {isLoading ? (
        <div className="m-5">Loading...</div>
      ) : (
        <>
          {/* HEADER */}
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-2 px-4 md:px-7 pt-3 md:pt-5">
              Conversion Summary
            </h2>
            <hr />
          </div>

          {/* BODY */}
          <div>
            {/* BODY HEADER */}
            <div className="mt-4 md:mt-7 px-4 md:px-7">
              <p className="text-xs text-gray-400">Total Conversions</p>
              <div className="flex items-center flex-wrap gap-2">
                <p className="text-xl md:text-2xl font-bold">
                  {totalConversions.toLocaleString("en")}
                </p>
                {changePercentage !== 0 && (
                  <p
                    className={`text-xs md:text-sm ${
                      changePercentage >= 0
                        ? "text-green-500"
                        : "text-red-500"
                    } flex items-center`}
                  >
                    {changePercentage >= 0 ? (
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                    )}
                    {Math.abs(changePercentage).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
            {/* CHART */}
            <ResponsiveContainer width="100%" height={150} className="p-2">
              <AreaChart
                data={purchaseData}
                margin={{ top: 5, right: 5, left: -30, bottom: 30 }}
              >
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                    });
                  }}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={(value) => value.toString()}
                  tick={{ fontSize: 10 }}
                  tickLine={false} 
                  axisLine={false}
                  width={25}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value} conversions`,
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    });
                  }}
                />
                <Area
                  type="linear"
                  dataKey="totalPurchased"
                  stroke="#8884d8"
                  fill="#8884d8"
                  dot={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default CardPurchaseSummary;
