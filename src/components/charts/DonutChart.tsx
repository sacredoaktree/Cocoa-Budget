import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';

interface Segment {
  color: string;
  value: number;
  label?: string;
}

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSub?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DonutChart({
  segments,
  size = 200,
  strokeWidth = 36,
  centerLabel,
  centerSub,
}: DonutChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth) / 2;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  if (total === 0) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none" />
      </Svg>
    );
  }

  let startAngle = 0;
  const paths: { d: string; color: string; key: string }[] = [];
  segments.forEach((seg, i) => {
    const sweep = (seg.value / total) * 360;
    const endAngle = startAngle + sweep;
    paths.push({ d: arcPath(cx, cy, r, startAngle, endAngle), color: seg.color, key: `seg-${i}` });
    startAngle = endAngle;
  });

  return (
    <Svg width={size} height={size}>
      {paths.map((p) => (
        <Path
          key={p.key}
          d={p.d}
          stroke={p.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {centerLabel ? (
        <SvgText
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill="#1A1008"
        >
          {centerLabel}
        </SvgText>
      ) : null}
      {centerSub ? (
        <SvgText x={cx} y={cy + 16} textAnchor="middle" fontSize="12" fill="#7A6858">
          {centerSub}
        </SvgText>
      ) : null}
    </Svg>
  );
}
