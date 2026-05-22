import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface SpendingDonutProps {
  data: DonutSlice[];
  symbol: string;
  total: number;
}

function formatCompact(value: number, symbol: string): string {
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${(value / 1_000).toFixed(1)}K`;
  return `${symbol}${value.toFixed(2)}`;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  symbol: string;
  total: number;
}

function CenterLabel({ cx, cy, symbol, total }: CustomLabelProps) {
  return (
    <>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-gray-400"
        style={{ fontSize: 11, fontFamily: 'inherit' }}
      >
        Total
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-gray-800"
        style={{ fontSize: 15, fontWeight: 700, fontFamily: 'inherit' }}
      >
        {formatCompact(total / 100, symbol)}
      </text>
    </>
  );
}

interface TooltipPayload {
  name: string;
  value: number;
  payload: DonutSlice;
}

function CustomTooltip({
  active,
  payload,
  symbol,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  symbol: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs font-semibold text-gray-700">{item.name}</p>
      <p className="text-sm font-bold text-gray-900">
        {symbol}{(item.value / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function SpendingDonut({ data, symbol, total }: SpendingDonutProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">
        No spending data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={70}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          labelLine={false}
          label={({ cx, cy }: { cx: number; cy: number }) => (
            <CenterLabel cx={cx} cy={cy} symbol={symbol} total={total} />
          )}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip symbol={symbol} />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value: string) => (
            <span style={{ color: '#6B7280' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
