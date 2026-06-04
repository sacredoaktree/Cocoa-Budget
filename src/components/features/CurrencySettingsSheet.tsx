import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Typography } from '../../theme/typography';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useExchangeRateStore } from '../../store/useExchangeRateStore';

export const SUPPORTED_CURRENCIES = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
];

interface Props {
  onClose: () => void;
}

export function CurrencySettingsSheet({ onClose }: Props) {
  const { colors } = useTheme();
  const { settings, updateSettings } = useSettingsStore();
  const { isLoading, lastFetched, fetchRates } = useExchangeRateStore();

  const handleSelect = (code: string, symbol: string) => {
    updateSettings({ currency: code, currencySymbol: symbol });
    fetchRates(code);
    onClose();
  };

  const formatLastFetched = () => {
    if (!lastFetched) return 'Never synced';
    const d = new Date(lastFetched);
    return `Updated ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <View style={[styles.sheet, { backgroundColor: colors.elevated }]}>
      <View style={styles.header}>
        <Text style={[Typography.headline3, { color: colors.textPrimary }]}>Base Currency</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.refreshBtn, { backgroundColor: colors.accent }]}
        onPress={() => fetchRates(settings.currency)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Ionicons name="refresh-outline" size={16} color="#FFF" />
        )}
        <Text style={[Typography.body2Semi, { color: '#FFF', marginLeft: 6 }]}>
          {isLoading ? 'Fetching rates…' : 'Refresh Live Rates'}
        </Text>
      </TouchableOpacity>

      <Text style={[Typography.caption, { color: colors.textTertiary, textAlign: 'center', marginBottom: 12 }]}>
        {formatLastFetched()} · via frankfurter.app (free)
      </Text>

      <FlatList
        data={SUPPORTED_CURRENCIES}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => {
          const active = settings.currency === item.code;
          return (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.divider }]}
              onPress={() => handleSelect(item.code, item.symbol)}
              activeOpacity={0.7}
            >
              <View style={[styles.symbolBadge, { backgroundColor: active ? colors.accent : colors.input }]}>
                <Text style={[Typography.body2Semi, { color: active ? '#FFF' : colors.textSecondary }]}>
                  {item.symbol}
                </Text>
              </View>
              <View style={styles.rowInfo}>
                <Text style={[Typography.body1Semi, { color: colors.textPrimary }]}>{item.code}</Text>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>{item.name}</Text>
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  symbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowInfo: { flex: 1 },
});
