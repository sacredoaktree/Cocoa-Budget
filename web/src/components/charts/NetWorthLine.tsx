import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface NetWorthDataPoint {
  date: string;
  amount: number;
}

interface NetWorthLineProps {
  data: NetWorthDataPoint[];
  symbol: string;
}

function formatYAxis(value: number, symbol: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value}`;
}

interface TooltipPayload {
  value: number;
  payload: NetWorthDataPoint;
}

function CustomTooltip({
  active,
  payload,
  label,
  symbol,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  symbol: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0].value;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-900">
        {symbol}
        {(value / 100).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}

export default function NetWorthLine({ data, symbol }: NetWorthLineProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
        No net worth data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatYAxis(v / 100, symbol)}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip content={<CustomTooltip symbol={symbol} />} />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#7C5CBF"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: '#7C5CBF', stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
