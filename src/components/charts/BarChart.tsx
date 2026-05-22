import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

interface BarGroup {
  label: string;
  income: number;
  expense: number;
}

interface BarChartProps {
  data: BarGroup[];
  width?: number;
  height?: number;
  incomeColor?: string;
  expenseColor?: string;
}

export function BarChart({
  data,
  width = 300,
  height = 180,
  incomeColor = '#2E9E6B',
  expenseColor = '#D94F3D',
}: BarChartProps) {
  if (!data.length) return <View style={{ width, height }} />;

  const padL = 44, padR = 12, padT = 12, padB = 28;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);
  const groupWidth = chartW / data.length;
  const barWidth = Math.min(groupWidth * 0.3, 14);
  const gap = barWidth * 0.4;

  const ySteps = 3;
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => ({
    y: padT + (chartH / ySteps) * (ySteps - i),
    value: Math.round((maxVal / ySteps) * i),
  }));

  const barH = (val: number) => (val / maxVal) * chartH;

  return (
    <Svg width={width} height={height}>
      {yLabels.map((yl, i) => (
        <React.Fragment key={i}>
          <Line
            x1={padL}
            y1={yl.y}
            x2={width - padR}
            y2={yl.y}
            stroke="#E8E4DF"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <SvgText
            x={padL - 4}
            y={yl.y + 4}
            textAnchor="end"
            fontSize="9"
            fill="#B0A090"
          >
            {yl.value >= 1000 ? `${(yl.value / 1000).toFixed(0)}k` : yl.value}
          </SvgText>
        </React.Fragment>
      ))}

      {data.map((d, i) => {
        const cx = padL + groupWidth * i + groupWidth / 2;
        const incomeH = barH(d.income);
        const expenseH = barH(d.expense);
        return (
          <React.Fragment key={i}>
            <Rect
              x={cx - barWidth - gap / 2}
              y={padT + chartH - incomeH}
              width={barWidth}
              height={incomeH}
              rx={3}
              fill={incomeColor}
            />
            <Rect
              x={cx + gap / 2}
              y={padT + chartH - expenseH}
              width={barWidth}
              height={expenseH}
              rx={3}
              fill={expenseColor}
            />
            <SvgText
              x={cx}
              y={height - 6}
              textAnchor="middle"
              fontSize="9"
              fill="#B0A090"
            >
              {d.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
