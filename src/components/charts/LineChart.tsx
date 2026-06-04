import React from 'react';
import { View } from 'react-native';
import Svg, {
  Polyline,
  Line,
  Text as SvgText,
  Circle,
} from 'react-native-svg';

interface DataPoint {
  label: string;   // x-axis label
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export function LineChart({
  data,
  width = 300,
  height = 160,
  color = '#C8956A',
  showDots = true,
}: LineChartProps) {
  if (!data.length) return <View style={{ width, height }} />;

  const padL = 40, padR = 16, padT = 16, padB = 32;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((d, i) => ({
    x: padL + (i / (data.length - 1 || 1)) * chartW,
    y: padT + chartH - (d.value / maxVal) * chartH,
    label: d.label,
    value: d.value,
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Y-axis labels
  const ySteps = [0, 0.5, 1];
  const yLabels = ySteps.map((f) => ({
    y: padT + chartH - f * chartH,
    label:
      f === 0
        ? '0'
        : f === 0.5
        ? `${Math.round(maxVal / 200)}k`
        : `${Math.round(maxVal / 100)}k`,
  }));

  // X-axis labels — show every nth
  const step = Math.ceil(data.length / 6);
  const xLabels = points.filter((_, i) => i % step === 0 || i === points.length - 1);

  return (
    <Svg width={width} height={height}>
      {/* Y grid lines */}
      {yLabels.map((yl, i) => (
        <React.Fragment key={i}>
          <Line
            x1={padL}
            y1={yl.y}
            x2={width - padR}
            y2={yl.y}
            stroke="#E8E4DF"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <SvgText
            x={padL - 4}
            y={yl.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="#B0A090"
          >
            {yl.label}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Line */}
      <Polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {showDots
        ? points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
          ))
        : null}

      {/* X labels */}
      {xLabels.map((p, i) => (
        <SvgText
          key={i}
          x={p.x}
          y={height - 4}
          textAnchor="middle"
          fontSize="10"
          fill="#B0A090"
        >
          {p.label}
        </SvgText>
      ))}
    </Svg>
  );
}
