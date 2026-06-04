import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface ProgressBarProps {
  percent: number;        // 0–1 (can exceed 1 for over-budget)
  height?: number;
  color?: string;
  animate?: boolean;
}

export function ProgressBar({ percent, height = 6, color, animate = true }: ProgressBarProps) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  const clampedPercent = Math.min(percent, 1);
  const fillColor =
    color ?? (percent >= 1 ? colors.expense : percent >= 0.8 ? colors.warning : colors.income);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clampedPercent,
      duration: animate ? 600 : 0,
      useNativeDriver: false,
    }).start();
  }, [clampedPercent, animate]);

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: colors.divider, borderRadius: height / 2 },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: fillColor,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: {},
});
