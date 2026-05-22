import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useAccountStore } from '../../src/store/useAccountStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';

function fmt(cents: number, sym: string) {
  return sym + (cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

function computeAmortization(
  balanceCents: number,
  annualRate: number,
  paymentCents: number
): AmortizationRow[] {
  if (paymentCents <= 0 || annualRate < 0) return [];
  const monthlyRate = annualRate / 100 / 12;
  const rows: AmortizationRow[] = [];
  let remaining = balanceCents;
  let month = 1;
  const maxMonths = 600;

  while (remaining > 0 && month <= maxMonths) {
    const interestCharge = monthlyRate > 0 ? Math.round(remaining * monthlyRate) : 0;
    const payment = Math.min(paymentCents, remaining + interestCharge);
    const principal = payment - interestCharge;
    remaining = Math.max(0, remaining - principal);
    rows.push({ month, payment, principal, interest: interestCharge, balance: remaining });
    month++;
  }
  return rows;
}

type Strategy = 'snowball' | 'avalanche';

export default function DebtPlannerScreen() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const sym = settings.currencySymbol;
  const accounts = useAccountStore((s) => s.accounts);
  const loanAccounts = accounts.filter((a) => a.type === 'loan' || a.type === 'credit');

  const [selectedId, setSelectedId] = useState<string>(loanAccounts[0]?.id ?? '');
  const [balanceInput, setBalanceInput] = useState('');
  const [rateInput, setRateInput] = useState('');
  const [paymentInput, setPaymentInput] = useState('');
  const [strategy, setStrategy] = useState<Strategy>('avalanche');
  const [showTable, setShowTable] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === selectedId);

  const balanceCents = useMemo(() => {
    const v = parseFloat(balanceInput);
    if (!isNaN(v) && v > 0) return Math.round(v * 100);
    return Math.abs(selectedAccount?.balance ?? 0);
  }, [balanceInput, selectedAccount]);

  const annualRate = useMemo(() => {
    const v = parseFloat(rateInput);
    if (!isNaN(v)) return v;
    return selectedAccount?.interestRate ?? 0;
  }, [rateInput, selectedAccount]);

  const paymentCents = useMemo(() => {
    const v = parseFloat(paymentInput);
    if (!isNaN(v) && v > 0) return Math.round(v * 100);
    return 0;
  }, [paymentInput]);

  const schedule = useMemo(
    () => (paymentCents > 0 ? computeAmortization(balanceCents, annualRate, paymentCents) : []),
    [balanceCents, annualRate, paymentCents]
  );

  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);
  const totalPaid = schedule.reduce((s, r) => s + r.payment, 0);
  const months = schedule.length;

  const payoffDate = useMemo(() => {
    if (months === 0) return '—';
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }, [months]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>Debt Planner</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Account picker */}
        {loanAccounts.length > 0 && (
          <>
            <Text style={[Typography.overline, styles.sectionLabel, { color: colors.textSecondary }]}>
              Select Account
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 16 }}>
              {loanAccounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => setSelectedId(a.id)}
                  style={[
                    styles.accountChip,
                    {
                      backgroundColor: selectedId === a.id ? a.color : colors.card,
                      borderColor: a.color,
                      borderWidth: 1,
                      ...Shadow.card,
                    },
                  ]}
                >
                  <Ionicons name={a.icon as any} size={16} color={selectedId === a.id ? '#FFF' : a.color} />
                  <Text style={[
                    Typography.body2Semi,
                    { color: selectedId === a.id ? '#FFF' : colors.textPrimary, marginLeft: 6 },
                  ]}>
                    {a.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Strategy toggle */}
        <Text style={[Typography.overline, styles.sectionLabel, { color: colors.textSecondary }]}>
          Strategy
        </Text>
        <View style={[styles.strategyToggle, { backgroundColor: colors.input, marginHorizontal: 16 }]}>
          {(['avalanche', 'snowball'] as Strategy[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStrategy(s)}
              style={[styles.strategyOption, strategy === s && { backgroundColor: colors.accent }]}
            >
              <Ionicons
                name={s === 'avalanche' ? 'trending-down-outline' : 'snow-outline'}
                size={16}
                color={strategy === s ? '#FFF' : colors.textSecondary}
              />
              <Text style={[Typography.body2Semi, {
                color: strategy === s ? '#FFF' : colors.textSecondary, marginLeft: 6,
              }]}>
                {s === 'avalanche' ? 'Avalanche (lowest interest)' : 'Snowball (lowest balance)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[Typography.caption, { color: colors.textSecondary, marginHorizontal: 16, marginTop: 6, marginBottom: 16 }]}>
          <Text style={[Typography.caption, { color: colors.textTertiary }]}>
            {strategy === 'avalanche'
              ? 'Pay off highest-interest debt first — saves the most on interest.'
              : 'Pay off smallest balance first — builds momentum with quick wins.'}
          </Text>
        </View>

        {/* Inputs */}
        <Text style={[Typography.overline, styles.sectionLabel, { color: colors.textSecondary }]}>
          Loan Details
        </Text>
        <View style={[styles.formCard, { backgroundColor: colors.card, ...Shadow.card }]}>
          <View style={styles.formRow}>
            <Text style={[Typography.body1, { color: colors.textSecondary, width: 130 }]}>Balance ({sym})</Text>
            <TextInput
              style={[Typography.body1Semi, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}
              value={balanceInput}
              onChangeText={setBalanceInput}
              placeholder={String((balanceCents / 100).toFixed(2))}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }]} />
          <View style={styles.formRow}>
            <Text style={[Typography.body1, { color: colors.textSecondary, width: 130 }]}>Annual Rate (%)</Text>
            <TextInput
              style={[Typography.body1Semi, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}
              value={rateInput}
              onChangeText={setRateInput}
              placeholder={String(annualRate)}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }]} />
          <View style={styles.formRow}>
            <Text style={[Typography.body1, { color: colors.textSecondary, width: 130 }]}>Monthly Payment</Text>
            <TextInput
              style={[Typography.body1Semi, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}
              value={paymentInput}
              onChangeText={setPaymentInput}
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Results */}
        {schedule.length > 0 && (
          <>
            <Text style={[Typography.overline, styles.sectionLabel, { color: colors.textSecondary }]}>
              Payoff Summary
            </Text>
            <View style={[styles.resultsGrid, { backgroundColor: colors.card, ...Shadow.card }]}>
              {[
                { label: 'Months to payoff', value: String(months), color: colors.accent },
                { label: 'Payoff date', value: payoffDate, color: colors.info },
                { label: 'Total interest', value: fmt(totalInterest, sym), color: colors.expense },
                { label: 'Total paid', value: fmt(totalPaid, sym), color: colors.textPrimary },
              ].map((item) => (
                <View key={item.label} style={styles.resultItem}>
                  <Text style={[Typography.headline3, { color: item.color }]}>{item.value}</Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Interest savings callout */}
            {totalInterest > 0 && (
              <View style={[styles.tipCard, { backgroundColor: colors.accent + '15' }]}>
                <Ionicons name="bulb-outline" size={18} color={colors.accent} />
                <Text style={[Typography.body2, { color: colors.accent, flex: 1, marginLeft: 8 }]}>
                  Doubling your monthly payment saves {fmt(totalInterest * 0.4, sym)} in interest and cuts the timeline nearly in half.
                </Text>
              </View>
            )}

            {/* Amortization table toggle */}
            <TouchableOpacity
              onPress={() => setShowTable(!showTable)}
              style={[styles.tableToggle, { backgroundColor: colors.card, ...Shadow.card }]}
            >
              <Text style={[Typography.body2Semi, { color: colors.textPrimary }]}>
                {showTable ? 'Hide' : 'Show'} Amortization Table
              </Text>
              <Ionicons name={showTable ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {showTable && (
              <View style={[styles.tableCard, { backgroundColor: colors.card, ...Shadow.card }]}>
                {/* Header */}
                <View style={[styles.tableRow, styles.tableHeader, { borderBottomColor: colors.divider }]}>
                  {['Mo.', 'Payment', 'Principal', 'Interest', 'Balance'].map((h) => (
                    <Text key={h} style={[Typography.captionSemi, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>{h}</Text>
                  ))}
                </View>
                {schedule.slice(0, 24).map((row) => (
                  <View key={row.month} style={[styles.tableRow, { borderBottomColor: colors.divider }]}>
                    <Text style={[Typography.caption, { color: colors.textSecondary, flex: 1, textAlign: 'right' }]}>{row.month}</Text>
                    <Text style={[Typography.caption, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}>{fmt(row.payment, sym)}</Text>
                    <Text style={[Typography.caption, { color: colors.income, flex: 1, textAlign: 'right' }]}>{fmt(row.principal, sym)}</Text>
                    <Text style={[Typography.caption, { color: colors.expense, flex: 1, textAlign: 'right' }]}>{fmt(row.interest, sym)}</Text>
                    <Text style={[Typography.caption, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}>{fmt(row.balance, sym)}</Text>
                  </View>
                ))}
                {schedule.length > 24 && (
                  <Text style={[Typography.caption, { color: colors.textTertiary, padding: 12, textAlign: 'center' }]}>
                    Showing first 24 of {schedule.length} months
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        {paymentCents === 0 && (
          <View style={styles.empty}>
            <Ionicons name="calculator-outline" size={52} color={colors.textTertiary} />
            <Text style={[Typography.body1, { color: colors.textTertiary, marginTop: 12 }]}>
              Enter a monthly payment to see your payoff plan
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  sectionLabel: { paddingHorizontal: 20, marginTop: 8, marginBottom: 8 },
  accountChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, marginRight: 8,
  },
  strategyToggle: { borderRadius: 12, padding: 4, marginBottom: 4 },
  strategyOption: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10 },
  formCard: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  formRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
  },
  resultsGrid: {
    marginHorizontal: 16, borderRadius: 16,
    flexDirection: 'row', flexWrap: 'wrap', padding: 8, marginBottom: 12,
  },
  resultItem: { width: '50%', alignItems: 'center', padding: 12 },
  tipCard: {
    marginHorizontal: 16, borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12,
  },
  tableToggle: {
    marginHorizontal: 16, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  tableCard: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  tableHeader: { borderBottomWidth: 1 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
});
