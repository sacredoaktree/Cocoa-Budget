import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useBillSplitStore } from '../../src/store/useBillSplitStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { formatGroupDate } from '../../src/utils/date';

export default function BillSplitScreen() {
  const { colors } = useTheme();
  const { settings } = useSettingsStore();
  const { entries, addEntry, settleEntry, getPeopleWithBalances } = useBillSplitStore();
  const sym = settings.currencySymbol;
  const [showAdd, setShowAdd] = useState(false);
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [direction, setDirection] = useState<'owe-me' | 'i-owe'>('owe-me');

  const fmt = (c: number) => (Math.abs(c) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const people = getPeopleWithBalances();
  const unsettled = entries.filter((e) => !e.isSettled);
  const settled = entries.filter((e) => e.isSettled);

  const handleAdd = () => {
    if (!person.trim() || !amount) return;
    const cents = Math.round(parseFloat(amount) * 100);
    addEntry({
      id: `split-${Date.now()}`,
      person: person.trim(),
      amount: direction === 'owe-me' ? cents : -cents,
      description: desc.trim() || 'Shared expense',
      date: new Date().toISOString().split('T')[0],
      isSettled: false,
      createdAt: new Date().toISOString(),
    });
    setPerson(''); setAmount(''); setDesc(''); setShowAdd(false);
  };

  const totalOwedToMe = people.filter((p) => p.balance > 0).reduce((s, p) => s + p.balance, 0);
  const totalIOwe = people.filter((p) => p.balance < 0).reduce((s, p) => s + Math.abs(p.balance), 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>Bill Splitting</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, ...Shadow.card }]}>
          <View style={styles.summaryItem}>
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>Owed to me</Text>
            <Text style={[Typography.headline2, { color: colors.income }]}>{sym}{fmt(totalOwedToMe)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.summaryItem}>
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>I owe</Text>
            <Text style={[Typography.headline2, { color: colors.expense }]}>{sym}{fmt(totalIOwe)}</Text>
          </View>
        </View>

        {/* People balances */}
        {people.length > 0 && (
          <>
            <Text style={[Typography.overline, styles.sectionLabel, { color: colors.textSecondary }]}>People</Text>
            {people.map((p) => {
              const owesMe = p.balance > 0;
              return (
                <View key={p.person} style={[styles.personCard, { backgroundColor: colors.card, ...Shadow.card }]}>
                  <View style={[styles.personAvatar, { backgroundColor: owesMe ? colors.income + '22' : colors.expense + '22' }]}>
                    <Text style={[Typography.headline3, { color: owesMe ? colors.income : colors.expense }]}>
                      {p.person[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[Typography.body1Semi, { color: colors.textPrimary }]}>{p.person}</Text>
                    <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                      {owesMe ? 'owes you' : 'you owe'}
                    </Text>
                  </View>
                  <Text style={[Typography.amountSmall, { color: owesMe ? colors.income : colors.expense }]}>
                    {owesMe ? '+' : '-'}{sym}{fmt(p.balance)}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        {/* Unsettled entries */}
        {unsettled.length > 0 && (
          <>
            <Text style={[Typography.overline, styles.sectionLabel, { color: colors.textSecondary }]}>Pending</Text>
            {unsettled.map((e) => {
              const owesMe = e.amount > 0;
              return (
                <View key={e.id} style={[styles.entryCard, { backgroundColor: colors.card, ...Shadow.card }]}>
                  <View style={styles.entryLeft}>
                    <Text style={[Typography.body1Semi, { color: colors.textPrimary }]}>{e.person}</Text>
                    <Text style={[Typography.caption, { color: colors.textSecondary }]}>{e.description}</Text>
                    <Text style={[Typography.caption, { color: colors.textTertiary }]}>{formatGroupDate(e.date)}</Text>
                  </View>
                  <View style={styles.entryRight}>
                    <Text style={[Typography.amountSmall, { color: owesMe ? colors.income : colors.expense }]}>
                      {owesMe ? '+' : '-'}{sym}{fmt(e.amount)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => settleEntry(e.id)}
                      style={[styles.settleBtn, { backgroundColor: colors.input }]}
                    >
                      <Text style={[Typography.captionSemi, { color: colors.textSecondary }]}>Settle</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {entries.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
            <Text style={[Typography.body1, { color: colors.textTertiary, marginTop: 12 }]}>No entries yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Entry Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[{ flex: 1, backgroundColor: colors.elevated }]} edges={['top','bottom']}>
          <View style={[styles.header, { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[Typography.headline3, { color: colors.textPrimary }]}>Add Entry</Text>
            <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
              <Text style={[Typography.body2Semi, { color: '#FFF' }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16, gap: 12 }}>
            {/* Direction toggle */}
            <View style={[styles.dirToggle, { backgroundColor: colors.input }]}>
              {(['owe-me', 'i-owe'] as const).map((d) => (
                <TouchableOpacity key={d} onPress={() => setDirection(d)}
                  style={[styles.dirBtn, direction === d && { backgroundColor: d === 'owe-me' ? colors.income : colors.expense }]}>
                  <Text style={[Typography.body2Semi, { color: direction === d ? '#FFF' : colors.textSecondary }]}>
                    {d === 'owe-me' ? 'They owe me' : 'I owe them'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.fieldRow, { backgroundColor: colors.card }]}>
              <Text style={[Typography.body2, { color: colors.textSecondary, width: 80 }]}>Person</Text>
              <TextInput value={person} onChangeText={setPerson} placeholder="Name" placeholderTextColor={colors.textTertiary}
                style={[Typography.body1, { color: colors.textPrimary, flex: 1 }]} />
            </View>
            <View style={[styles.fieldRow, { backgroundColor: colors.card }]}>
              <Text style={[Typography.body2, { color: colors.textSecondary, width: 80 }]}>Amount</Text>
              <TextInput value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad"
                placeholderTextColor={colors.textTertiary} style={[Typography.body1Semi, { color: colors.textPrimary, flex: 1 }]} />
            </View>
            <View style={[styles.fieldRow, { backgroundColor: colors.card }]}>
              <Text style={[Typography.body2, { color: colors.textSecondary, width: 80 }]}>For</Text>
              <TextInput value={desc} onChangeText={setDesc} placeholder="What's it for?" placeholderTextColor={colors.textTertiary}
                style={[Typography.body1, { color: colors.textPrimary, flex: 1 }]} />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  addBtn: { minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  summaryCard: { marginHorizontal: 16, borderRadius: 16, padding: 20, flexDirection: 'row', marginBottom: 16 },
  summaryItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1 },
  sectionLabel: { paddingHorizontal: 20, marginBottom: 8 },
  personCard: { marginHorizontal: 16, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  personAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  entryCard: { marginHorizontal: 16, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  entryLeft: { flex: 1 },
  entryRight: { alignItems: 'flex-end', gap: 6 },
  settleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  empty: { alignItems: 'center', paddingTop: 80 },
  dirToggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  dirBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, gap: 8 },
});
