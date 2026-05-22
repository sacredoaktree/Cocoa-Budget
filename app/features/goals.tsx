import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../src/theme';
import { Typography } from '../../src/theme/typography';
import { Shadow } from '../../src/theme/spacing';
import { useSavingsGoalStore } from '../../src/store/useSavingsGoalStore';
import { useSettingsStore } from '../../src/store/useSettingsStore';
import { SavingsGoal } from '../../src/types';
import { formatDate } from '../../src/utils/date';
import { differenceInMonths, parseISO } from 'date-fns';

function CircularProgress({ percent, size = 80, color }: { percent: number; size: number; color: string }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(percent, 1) * circ;
  const cx = size / 2, cy = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} stroke="#E8E4DF" strokeWidth={8} fill="none" />
      <Circle
        cx={cx} cy={cy} r={r}
        stroke={color}
        strokeWidth={8}
        fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${cx},${cy}`}
      />
    </Svg>
  );
}

const GOAL_ICONS = ['shield-checkmark-outline','airplane-outline','home-outline','laptop-outline','car-outline','school-outline','gift-outline','heart-outline'];
const GOAL_COLORS = ['#2E9E6B','#4A90D9','#D4AF37','#8B5CF6','#C8956A','#D94F3D','#2AADCC','#E84E8A'];

export default function GoalsScreen() {
  const { colors } = useTheme();
  const { goals, addGoal, contribute } = useSavingsGoalStore();
  const { settings } = useSettingsStore();
  const sym = settings.currencySymbol;
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('2027-01-01');
  const [selIcon, setSelIcon] = useState(GOAL_ICONS[0]);
  const [selColor, setSelColor] = useState(GOAL_COLORS[0]);

  const fmt = (c: number) => (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });

  const handleAdd = () => {
    if (!name.trim() || !target) return;
    addGoal({
      id: `goal-${Date.now()}`,
      name: name.trim(),
      icon: selIcon,
      color: selColor,
      targetAmount: Math.round(parseFloat(target) * 100),
      currentAmount: 0,
      deadline,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setName(''); setTarget(''); setShowAdd(false);
  };

  const active = goals.filter((g) => !g.isCompleted);
  const done = goals.filter((g) => g.isCompleted);

  const monthsLeft = (g: SavingsGoal) => {
    const m = differenceInMonths(parseISO(g.deadline), new Date());
    return Math.max(m, 1);
  };

  const monthlyNeeded = (g: SavingsGoal) => {
    const remaining = g.targetAmount - g.currentAmount;
    return remaining > 0 ? Math.ceil(remaining / monthsLeft(g)) : 0;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>Savings Goals</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {active.length === 0 && done.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={52} color={colors.textTertiary} />
            <Text style={[Typography.body1, { color: colors.textTertiary, marginTop: 12 }]}>No savings goals yet</Text>
          </View>
        )}

        {active.map((g) => {
          const pct = g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0;
          const needed = monthlyNeeded(g);
          return (
            <View key={g.id} style={[styles.card, { backgroundColor: colors.card, ...Shadow.card }]}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <CircularProgress percent={pct} size={72} color={g.color} />
                  <Text style={[Typography.body2Semi, { color: g.color, position: 'absolute', fontSize: 12 }]}>
                    {Math.round(pct * 100)}%
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <View style={[styles.iconBadge, { backgroundColor: g.color + '22' }]}>
                    <Ionicons name={g.icon as any} size={16} color={g.color} />
                  </View>
                  <Text style={[Typography.headline3, { color: colors.textPrimary, marginTop: 4 }]}>{g.name}</Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    Deadline: {formatDate(g.deadline, 'MMM d, yyyy')}
                  </Text>
                </View>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: colors.divider }]}>
                <View style={[styles.progressFill, { backgroundColor: g.color, width: `${Math.min(pct * 100, 100)}%` }]} />
              </View>

              <View style={styles.amountRow}>
                <Text style={[Typography.body2, { color: colors.textSecondary }]}>
                  {sym}{fmt(g.currentAmount)} saved
                </Text>
                <Text style={[Typography.body2Semi, { color: colors.textPrimary }]}>
                  of {sym}{fmt(g.targetAmount)}
                </Text>
              </View>

              {needed > 0 && (
                <View style={[styles.neededChip, { backgroundColor: g.color + '15' }]}>
                  <Text style={[Typography.captionSemi, { color: g.color }]}>
                    {sym}{fmt(needed)}/month needed
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {done.length > 0 && (
          <>
            <Text style={[Typography.overline, styles.sectionLabel, { color: colors.textSecondary }]}>Completed</Text>
            {done.map((g) => (
              <View key={g.id} style={[styles.doneCard, { backgroundColor: colors.card, ...Shadow.card }]}>
                <View style={[styles.doneIcon, { backgroundColor: g.color }]}>
                  <Ionicons name={g.icon as any} size={20} color="#FFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.body1Semi, { color: colors.textPrimary }]}>{g.name}</Text>
                  <Text style={[Typography.caption, { color: colors.income }]}>Goal reached! 🎉</Text>
                </View>
                <Text style={[Typography.body2Semi, { color: colors.income }]}>{sym}{fmt(g.targetAmount)}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.elevated }]} edges={['top','bottom']}>
          <View style={[styles.header, { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[Typography.headline3, { color: colors.textPrimary }]}>New Goal</Text>
            <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
              <Text style={[Typography.body2Semi, { color: '#FFF' }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={[styles.formCard, { backgroundColor: colors.card }]}>
              <TextInput
                style={[Typography.headline2, { color: colors.textPrimary, padding: 12 }]}
                value={name}
                onChangeText={setName}
                placeholder="Goal name..."
                placeholderTextColor={colors.textTertiary}
              />
              <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }]} />
              <View style={styles.formRow}>
                <Text style={[Typography.body1, { color: colors.textSecondary }]}>Target</Text>
                <TextInput
                  style={[Typography.body1Semi, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}
                  value={target}
                  onChangeText={setTarget}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }]} />
              <View style={styles.formRow}>
                <Text style={[Typography.body1, { color: colors.textSecondary }]}>Deadline</Text>
                <Text style={[Typography.body1Semi, { color: colors.textPrimary }]}>{deadline}</Text>
              </View>
            </View>
            <Text style={[Typography.body2Semi, { color: colors.textSecondary, marginTop: 16, marginBottom: 8 }]}>Icon</Text>
            <View style={styles.iconRow}>
              {GOAL_ICONS.map((ic) => (
                <TouchableOpacity key={ic} onPress={() => setSelIcon(ic)}
                  style={[styles.iconOption, { backgroundColor: selIcon === ic ? colors.accent : colors.input }]}>
                  <Ionicons name={ic as any} size={20} color={selIcon === ic ? '#FFF' : colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[Typography.body2Semi, { color: colors.textSecondary, marginTop: 16, marginBottom: 8 }]}>Color</Text>
            <View style={styles.iconRow}>
              {GOAL_COLORS.map((c) => (
                <TouchableOpacity key={c} onPress={() => setSelColor(c)}
                  style={[styles.colorDot, { backgroundColor: c, borderWidth: selColor === c ? 3 : 0, borderColor: '#FFF' }]} />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  addBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  card: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardLeft: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardInfo: { flex: 1 },
  iconBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  neededChip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sectionLabel: { paddingHorizontal: 20, marginTop: 8, marginBottom: 8 },
  doneCard: { marginHorizontal: 16, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  doneIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1 },
  formCard: { borderRadius: 14, overflow: 'hidden' },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconOption: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
});
