import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { Typography } from '../theme/typography';
import { Shadow } from '../theme/spacing';

interface CategoryCardProps {
  category: Category;
  amount: number;        // in cents
  symbol?: string;
  onPress?: () => void;
}

export function CategoryCard({
  category,
  amount,
  symbol = '₱',
  onPress,
}: CategoryCardProps) {
  const formattedAmount = (amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const iconName = category.icon as any;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: category.bgColor }, Shadow.card]}
    >
      <Text
        style={[Typography.body2Semi, { color: '#3D2B1F', marginBottom: 8 }]}
        numberOfLines={1}
      >
        {category.name}
      </Text>
      <View style={[styles.iconCircle, { backgroundColor: category.color }]}>
        <Ionicons name={iconName} size={22} color="#FFFFFF" />
      </View>
      <Text style={[Typography.body1Semi, { color: '#3D2B1F', marginTop: 10 }]}>
        {symbol}{formattedAmount}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 120,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    margin: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
