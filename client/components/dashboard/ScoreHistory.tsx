"use client";

import { Card } from "@/components/ui/Card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ScoreHistoryProps {
  data: Array<{ timestamp: number; score: number }>;
}

export function ScoreHistory({ data }: ScoreHistoryProps) {
  const chartData = data.map((item) => ({
    time: new Date(item.timestamp * 1000).toLocaleDateString(),
    score: Number(item.score),
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-300 mb-4">Score History</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No history data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-300 mb-6">Score History</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="time"
            stroke="#94A3B8"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#94A3B8"
            style={{ fontSize: "12px" }}
            domain={[0, 1000]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1E293B",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#F1F5F9",
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: "#F59E0B", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
