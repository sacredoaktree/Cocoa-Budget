import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface IncomeExpenseDataPoint {
  label: string;
  income: number;
  expense: number;
}

interface IncomeExpenseBarProps {
  data: IncomeExpenseDataPoint[];
  symbol: string;
}

function formatYAxis(value: number, symbol: string): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${symbol}${(value / 1_000).toFixed(0)}K`;
  return `${symbol}${value}`;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
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

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 space-y-1">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-600 capitalize">{entry.name}</span>
          <span className="text-xs font-bold text-gray-900 ml-auto pl-3">
            {symbol}
            {(entry.value / 100).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function IncomeExpenseBar({ data, symbol }: IncomeExpenseBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 16, left: 8, bottom: 4 }}
        barCategoryGap="30%"
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="label"
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
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value: string) => (
            <span style={{ color: '#6B7280', textTransform: 'capitalize' }}>{value}</span>
          )}
        />
        <Bar
          dataKey="income"
          name="income"
          fill="#2E9E6B"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="expense"
          fill="#D94F3D"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
