"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface TrendDataPoint {
  date: string;
  passed: number;
  failed: number;
}

interface PassFailTrendProps {
  data: TrendDataPoint[];
}

export function PassFailTrend({ data }: PassFailTrendProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-[#232b3b] rounded-xl bg-[#141a24]">
        No trend data available
      </div>
    );
  }

  return (
    <div className="h-64 w-full p-4 border border-[#232b3b] rounded-xl bg-[#141a24]">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Pass / Fail Trend</h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232b3b" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0b0f17", borderColor: "#232b3b", color: "#f1f5f9" }}
          />
          <Legend />
          <Bar dataKey="passed" fill="#10b981" radius={[4, 4, 0, 0]} name="Passed" />
          <Bar dataKey="failed" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Failed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
