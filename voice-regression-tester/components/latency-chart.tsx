"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface LatencyDataPoint {
  turn: string;
  latencyMs: number;
}

interface LatencyChartProps {
  data: LatencyDataPoint[];
}

export function LatencyChart({ data }: LatencyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-[#232b3b] rounded-xl bg-[#141a24]">
        No latency data recorded
      </div>
    );
  }

  return (
    <div className="h-64 w-full p-4 border border-[#232b3b] rounded-xl bg-[#141a24]">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Turn Latency (ms)</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#232b3b" />
          <XAxis dataKey="turn" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} unit="ms" />
          <Tooltip
            contentStyle={{ backgroundColor: "#0b0f17", borderColor: "#232b3b", color: "#f1f5f9" }}
          />
          <Line
            type="monotone"
            dataKey="latencyMs"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: "#6366f1", r: 4 }}
            name="Latency (ms)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
