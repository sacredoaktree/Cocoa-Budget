import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, Modal, Pressable,
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

// ── Constants ─────────────────────────────────────────────────────────────────
const GOAL_ICONS: { key: string; name: string }[] = [
  { key: 'shield-checkmark-outline', name: 'shield-checkmark-outline' },
  { key: 'airplane-outline', name: 'airplane-outline' },
  { key: 'home-outline', name: 'home-outline' },
  { key: 'laptop-outline', name: 'laptop-outline' },
  { key: 'car-outline', name: 'car-outline' },
  { key: 'school-outline', name: 'school-outline' },
  { key: 'gift-outline', name: 'gift-outline' },
  { key: 'heart-outline', name: 'heart-outline' },
  { key: 'trophy-outline', name: 'trophy-outline' },
  { key: 'star-outline', name: 'star-outline' },
  { key: 'medical-outline', name: 'medical-outline' },
  { key: 'diamond-outline', name: 'diamond-outline' },
];

const GOAL_COLORS = [
  '#2E9E6B', '#4A90D9', '#8B5CF6', '#D94F3D',
  '#E88C2A', '#D4AF37', '#C8956A', '#EC4899',
  '#06B6D4', '#10B981', '#F43F5E', '#6366F1',
];

// ── Utilities ─────────────────────────────────────────────────────────────────
function calcRates(remaining: number, daysLeft: number) {
  if (daysLeft <= 0 || remaining <= 0) return { daily: 0, weekly: 0, biweekly: 0, monthly: 0 };
  return {
    daily: remaining / daysLeft,
    weekly: (remaining / daysLeft) * 7,
    biweekly: (remaining / daysLeft) * 14,
    monthly: (remaining / daysLeft) * 30.44,
  };
}

function fmt(cents: number, sym: string) {
  return `${sym}${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

// ── Circular Progress ─────────────────────────────────────────────────────────
function CircularProgress({ percent, size = 80, color, trackColor = '#E8E4DF' }: {
  percent: number; size: number; color: string; trackColor?: string;
}) {
  const sw = 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(percent, 1) * circ;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={sw} fill="none" />
      <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw} fill="none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        rotation="-90" origin={`${cx},${cy}`} />
    </Svg>
  );
}

// ── Goal Modal ────────────────────────────────────────────────────────────────
interface GoalModalProps {
  goal?: SavingsGoal;
  onClose: () => void;
  sym: string;
  colors: ReturnType<typeof useTheme>['colors'];
}

function GoalModal({ goal, onClose, sym, colors }: GoalModalProps) {
  const { addGoal, updateGoal } = useSavingsGoalStore();
  const isEdit = !!goal;

  const [name, setName] = useState(goal?.name ?? '');
  const [targetStr, setTargetStr] = useState(goal ? String(goal.targetAmount / 100) : '');
  const [savedStr, setSavedStr] = useState(goal ? String(goal.currentAmount / 100) : '0');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [selIcon, setSelIcon] = useState(goal?.icon ?? GOAL_ICONS[0].key);
  const [selColor, setSelColor] = useState(goal?.color ?? GOAL_COLORS[0]);

  const targetCents = Math.round((parseFloat(targetStr) || 0) * 100);
  const savedCents = Math.round((parseFloat(savedStr) || 0) * 100);
  const remaining = Math.max(targetCents - savedCents, 0);
  const daysLeft = deadline
    ? Math.max(Math.ceil((new Date(deadline + 'T00:00:00').getTime() - Date.now()) / 86400000), 0)
    : 0;
  const rates = calcRates(remaining, daysLeft);

  const handleSave = () => {
    if (!name.trim() || !targetCents || !deadline) return;
    const now = new Date().toISOString();
    if (isEdit && goal) {
      updateGoal(goal.id, {
        name: name.trim(), icon: selIcon, color: selColor,
        targetAmount: targetCents, currentAmount: savedCents,
        deadline, isCompleted: savedCents >= targetCents,
      });
    } else {
      addGoal({
        id: `goal-${Date.now()}`, name: name.trim(), icon: selIcon, color: selColor,
        targetAmount: targetCents, currentAmount: savedCents, deadline,
        isCompleted: savedCents >= targetCents, createdAt: now, updatedAt: now,
      });
    }
    onClose();
  };

  const showRates = remaining > 0 && daysLeft > 0;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.modal, { backgroundColor: colors.elevated }]} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.mHeader, { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <TouchableOpacity onPress={onClose} style={styles.mHeaderBtn}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[Typography.headline3, { color: colors.textPrimary }]}>
            {isEdit ? 'Edit Goal' : 'New Goal'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={[styles.mHeaderBtn, styles.saveBtn, { backgroundColor: selColor }]}>
            <Text style={[Typography.body2Semi, { color: '#FFF' }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Live preview banner */}
          <View style={[styles.previewBanner, { backgroundColor: selColor }]}>
            <CircularProgress percent={targetCents > 0 ? (savedCents / targetCents) * 100 : 0}
              size={60} color="rgba(255,255,255,0.4)" trackColor="rgba(255,255,255,0.15)" />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={[Typography.headline3, { color: '#FFF', marginBottom: 2 }]}>{name || 'My Goal'}</Text>
              {deadline ? (
                <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.7)' }]}>
                  {daysLeft > 0 ? `${daysLeft} days remaining` : 'Deadline reached'}
                </Text>
              ) : (
                <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.5)' }]}>Set a deadline below</Text>
              )}
            </View>
          </View>

          {/* Form fields */}
          <View style={[styles.formCard, { backgroundColor: colors.card }]}>
            <TextInput
              style={[Typography.body1, { color: colors.textPrimary, padding: 14 }]}
              value={name} onChangeText={setName}
              placeholder="Goal name..." placeholderTextColor={colors.textTertiary} />
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }} />

            <View style={styles.formRow}>
              <Text style={[Typography.body1, { color: colors.textSecondary }]}>Target Amount</Text>
              <TextInput
                style={[Typography.body1Semi, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}
                value={targetStr} onChangeText={setTargetStr}
                placeholder="0.00" keyboardType="decimal-pad"
                placeholderTextColor={colors.textTertiary} />
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }} />

            <View style={styles.formRow}>
              <Text style={[Typography.body1, { color: colors.textSecondary }]}>Already Saved</Text>
              <TextInput
                style={[Typography.body1Semi, { color: colors.textPrimary, flex: 1, textAlign: 'right' }]}
                value={savedStr} onChangeText={setSavedStr}
                placeholder="0.00" keyboardType="decimal-pad"
                placeholderTextColor={colors.textTertiary} />
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.divider }} />

            <View style={styles.formRow}>
              <Text style={[Typography.body1, { color: colors.textSecondary }]}>Target Date</Text>
              <TextInput
                style={[Typography.body1Semi, { color: colors.textPrimary }]}
                value={deadline} onChangeText={setDeadline}
                placeholder="YYYY-MM-DD" placeholderTextColor={colors.textTertiary} />
            </View>
          </View>

          {/* Savings rate calculator */}
          {showRates && (
            <View style={[styles.rateCard, { backgroundColor: selColor + '12', borderColor: selColor + '30' }]}>
              <View style={styles.rateCardHeader}>
                <Ionicons name="flash-outline" size={14} color={selColor} />
                <Text style={[Typography.captionSemi, { color: selColor, marginLeft: 6 }]}>
                  Save this much to reach your goal on time
                </Text>
              </View>
              <View style={styles.rateGrid}>
                {[
                  { label: 'Daily', value: rates.daily },
                  { label: 'Weekly', value: rates.weekly },
                  { label: 'Bi-weekly', value: rates.biweekly },
                  { label: 'Monthly', value: rates.monthly },
                ].map(({ label, value }) => (
                  <View key={label} style={[styles.rateCell, { backgroundColor: colors.card }]}>
                    <Text style={[Typography.caption, { color: colors.textTertiary, marginBottom: 2 }]}>{label}</Text>
                    <Text style={[Typography.body2Semi, { color: selColor }]}>{fmt(Math.round(value), sym)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Icon picker */}
          <Text style={[Typography.body2Semi, { color: colors.textSecondary, marginTop: 20, marginBottom: 10 }]}>Icon</Text>
          <View style={styles.iconRow}>
            {GOAL_ICONS.map(({ key, name: icName }) => (
              <TouchableOpacity key={key} onPress={() => setSelIcon(key)}
                style={[styles.iconOption, {
                  backgroundColor: selIcon === key ? selColor : colors.input,
                  borderWidth: selIcon === key ? 2 : 0,
                  borderColor: selIcon === key ? selColor : 'transparent',
                }]}>
                <Ionicons name={icName as any} size={20} color={selIcon === key ? '#FFF' : colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Color picker */}
          <Text style={[Typography.body2Semi, { color: colors.textSecondary, marginTop: 20, marginBottom: 10 }]}>Color</Text>
          <View style={styles.iconRow}>
            {GOAL_COLORS.map((c) => (
              <TouchableOpacity key={c} onPress={() => setSelColor(c)}
                style={[styles.colorDot, { backgroundColor: c },
                  selColor === c && { borderWidth: 3, borderColor: '#FFF', shadowColor: c, shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }
                ]} />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Contribute Modal ──────────────────────────────────────────────────────────
function ContributeModal({ goal, onClose, sym, colors }: {
  goal: SavingsGoal; onClose: () => void; sym: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const { contribute } = useSavingsGoalStore();
  const [amtStr, setAmtStr] = useState('');

  const handleAdd = () => {
    const cents = Math.round(parseFloat(amtStr) * 100);
    if (!cents || cents <= 0) return;
    contribute(goal.id, cents);
    onClose();
  };

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" transparent>
      <View style={styles.overlay}>
        <View style={[styles.contributeSheet, { backgroundColor: colors.elevated }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.contributeHeader}>
            <Text style={[Typography.headline3, { color: colors.textPrimary }]}>{goal.name}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[Typography.body2, { color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
            {fmt(remaining, sym)} remaining to reach this goal
          </Text>

          <View style={[styles.amtInput, { borderColor: colors.divider, backgroundColor: colors.input }]}>
            <Text style={[Typography.headline2, { color: colors.textSecondary }]}>{sym}</Text>
            <TextInput
              style={[Typography.headline1, { color: colors.textPrimary, flex: 1, textAlign: 'center' }]}
              value={amtStr} onChangeText={setAmtStr}
              keyboardType="decimal-pad" placeholder="0.00"
              placeholderTextColor={colors.textTertiary} autoFocus />
          </View>

          {/* Quick amounts */}
          <View style={styles.quickRow}>
            {[10, 50, 100, 500].map((v) => (
              <TouchableOpacity key={v} onPress={() => setAmtStr(String(v))}
                style={[styles.quickChip, { backgroundColor: colors.input }]}>
                <Text style={[Typography.body2Semi, { color: colors.textSecondary }]}>{sym}{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={handleAdd}
            style={[styles.contributeBtn, { backgroundColor: goal.color }]}>
            <Text style={[Typography.body1Semi, { color: '#FFF' }]}>
              {amtStr && parseFloat(amtStr) > 0 ? `Add ${sym}${parseFloat(amtStr).toFixed(2)}` : 'Add Contribution'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, sym, colors, onEdit }: {
  goal: SavingsGoal; sym: string;
  colors: ReturnType<typeof useTheme>['colors'];
  onEdit: () => void;
}) {
  const { deleteGoal } = useSavingsGoalStore();
  const [showContribute, setShowContribute] = useState(false);

  const now = Date.now();
  const createdAt = new Date(goal.createdAt).getTime();
  const deadlineTs = new Date(goal.deadline + 'T00:00:00').getTime();
  const daysLeft = Math.max(Math.ceil((deadlineTs - now) / 86400000), 0);
  const totalSpan = Math.max(deadlineTs - createdAt, 1);
  const timeElapsedPct = Math.min(Math.max((now - createdAt) / totalSpan, 0), 1);

  const pct = goal.targetAmount > 0 ? Math.min(goal.currentAmount / goal.targetAmount, 1) : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const rates = calcRates(remaining, daysLeft);

  const isCompleted = goal.isCompleted || pct >= 1;
  const isOverdue = !isCompleted && daysLeft === 0;
  const isBehind = !isCompleted && !isOverdue && pct < timeElapsedPct - 0.05;

  const statusColor = isCompleted ? '#2E9E6B' : isOverdue ? '#D94F3D' : isBehind ? '#E88C2A' : '#2E9E6B';
  const statusLabel = isCompleted ? '🎉 Completed' : isOverdue ? '⚠️ Overdue' : isBehind ? '⏳ Behind' : '✅ On track';

  const deadlineLabel = new Date(goal.deadline + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, ...Shadow.card }]}>
        {/* Color stripe */}
        <View style={[styles.stripe, { backgroundColor: goal.color }]} />

        <View style={{ padding: 16 }}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={styles.ringWrap}>
              <CircularProgress percent={pct * 100} size={76} color={goal.color} trackColor={colors.divider} />
              <View style={styles.ringCenter}>
                <Ionicons name={goal.icon as any} size={22} color={goal.color} />
                <Text style={[Typography.caption, { color: goal.color, fontWeight: '700', marginTop: 1 }]}>
                  {Math.round(pct * 100)}%
                </Text>
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.nameLine}>
                <Text style={[Typography.headline3, { color: colors.textPrimary, flex: 1 }]} numberOfLines={1}>{goal.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                  <Text style={[Typography.caption, { color: statusColor, fontSize: 10 }]}>{statusLabel}</Text>
                </View>
              </View>
              <Text style={[Typography.caption, { color: colors.textTertiary, marginTop: 2 }]}>
                📅 {deadlineLabel}{daysLeft > 0 && !isCompleted ? ` · ${daysLeft}d left` : ''}
              </Text>
              <View style={styles.amtRow}>
                <Text style={[Typography.headline3, { color: colors.textPrimary }]}>{fmt(goal.currentAmount, sym)}</Text>
                <Text style={[Typography.body2, { color: colors.textSecondary, marginLeft: 6 }]}>
                  of {fmt(goal.targetAmount, sym)}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
                <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteGoal(goal.id)} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={16} color="#D94F3D" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.divider, marginTop: 14 }]}>
            <View style={[styles.progressFill, { backgroundColor: goal.color, width: `${Math.min(pct * 100, 100)}%` as any }]} />
          </View>

          {/* Timeline */}
          {!isCompleted && (
            <View style={{ marginTop: 12 }}>
              <Text style={[Typography.caption, { color: colors.textTertiary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }]}>
                Timeline
              </Text>
              <View style={[styles.timelineTrack, { backgroundColor: colors.divider }]}>
                <View style={[styles.timelineFill, { width: `${timeElapsedPct * 100}%` as any, backgroundColor: colors.divider }]} />
                <View style={[styles.timelineSaved, { width: `${pct * 100}%` as any, backgroundColor: goal.color, opacity: 0.6 }]} />
                {timeElapsedPct > 0.03 && timeElapsedPct < 0.97 && (
                  <View style={[styles.todayDot, {
                    left: `${timeElapsedPct * 100}%` as any,
                    backgroundColor: '#8A7A68',
                  }]} />
                )}
              </View>
              <View style={styles.timelineLabels}>
                <Text style={[Typography.caption, { color: colors.textTertiary, fontSize: 10 }]}>Start</Text>
                <Text style={[Typography.caption, { color: colors.textTertiary, fontSize: 10 }]}>Today</Text>
                <Text style={[Typography.caption, { color: colors.textTertiary, fontSize: 10 }]}>Goal</Text>
              </View>
            </View>
          )}

          {/* Savings rates */}
          {remaining > 0 && daysLeft > 0 && (
            <View style={{ marginTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, paddingTop: 14 }}>
              <View style={styles.ratesHeader}>
                <Ionicons name="flash-outline" size={12} color={colors.textTertiary} />
                <Text style={[Typography.caption, { color: colors.textTertiary, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.6 }]}>
                  How much to save per period
                </Text>
              </View>
              <View style={styles.rateGrid}>
                {[
                  { label: 'Daily', value: rates.daily },
                  { label: 'Weekly', value: rates.weekly },
                  { label: 'Bi-weekly', value: rates.biweekly },
                  { label: 'Monthly', value: rates.monthly },
                ].map(({ label, value }) => (
                  <View key={label} style={[styles.rateCell, { backgroundColor: colors.input }]}>
                    <Text style={[Typography.caption, { color: colors.textTertiary, fontSize: 10, marginBottom: 2 }]}>{label}</Text>
                    <Text style={[Typography.body2Semi, { color: goal.color }]}>{fmt(Math.round(value), sym)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contribute button */}
          {!isCompleted && (
            <TouchableOpacity onPress={() => setShowContribute(true)}
              style={[styles.contributeBtn2, { backgroundColor: goal.color, marginTop: 14 }]}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={[Typography.body2Semi, { color: '#FFF', marginLeft: 6 }]}>Add Contribution</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showContribute && (
        <ContributeModal goal={goal} onClose={() => setShowContribute(false)} sym={sym} colors={colors} />
      )}
    </>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function GoalsScreen() {
  const { colors } = useTheme();
  const { goals } = useSavingsGoalStore();
  const { settings } = useSettingsStore();
  const sym = settings.currencySymbol;
  const [showAdd, setShowAdd] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const active = goals.filter((g) => !g.isCompleted);
  const done = goals.filter((g) => g.isCompleted);

  const totalSaved = active.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.min(totalSaved / totalTarget, 1) : 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[Typography.headline2, { color: colors.textPrimary }]}>Savings Goals</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}
          style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Summary hero */}
        {active.length > 0 && (
          <View style={[styles.hero, { backgroundColor: '#3D2B1F' }]}>
            <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.6)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }]}>
              Total Progress
            </Text>
            <View style={styles.heroAmtRow}>
              <Text style={[Typography.headline1, { color: '#FFF' }]}>{fmt(totalSaved, sym)}</Text>
              <Text style={[Typography.body2, { color: 'rgba(255,255,255,0.6)', marginLeft: 8 }]}>of {fmt(totalTarget, sym)}</Text>
            </View>
            <View style={[styles.heroTrack, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <View style={[styles.heroFill, { width: `${overallPct * 100}%` as any }]} />
            </View>
            <Text style={[Typography.caption, { color: 'rgba(255,255,255,0.5)', marginTop: 6 }]}>
              {(overallPct * 100).toFixed(1)}% across all active goals
            </Text>
          </View>
        )}

        {/* Empty state */}
        {active.length === 0 && done.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={56} color={colors.textTertiary} />
            <Text style={[Typography.body1Semi, { color: colors.textSecondary, marginTop: 14 }]}>No savings goals yet</Text>
            <Text style={[Typography.body2, { color: colors.textTertiary, marginTop: 6, textAlign: 'center' }]}>
              Create your first goal and see a personalized{'\n'}savings plan come to life
            </Text>
            <TouchableOpacity onPress={() => setShowAdd(true)}
              style={[styles.emptyBtn, { backgroundColor: colors.accent }]}>
              <Text style={[Typography.body2Semi, { color: '#FFF' }]}>Create a Goal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active goals */}
        {active.map((g) => (
          <GoalCard key={g.id} goal={g} sym={sym} colors={colors} onEdit={() => setEditingGoal(g)} />
        ))}

        {/* Completed */}
        {done.length > 0 && (
          <View style={[styles.completedSection, { backgroundColor: colors.card, ...Shadow.card }]}>
            <View style={[styles.completedHeader, { borderBottomColor: colors.divider }]}>
              <Ionicons name="checkmark-circle" size={18} color="#2E9E6B" />
              <Text style={[Typography.body1Semi, { color: colors.textPrimary, marginLeft: 8 }]}>
                Completed Goals
              </Text>
              <View style={[styles.countBadge, { backgroundColor: colors.input }]}>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>{done.length}</Text>
              </View>
            </View>
            {done.map((g) => (
              <View key={g.id} style={[styles.doneRow, { borderBottomColor: colors.divider }]}>
                <View style={[styles.doneIcon, { backgroundColor: g.color + '22' }]}>
                  <Ionicons name={g.icon as any} size={18} color={g.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[Typography.body2Semi, { color: colors.textPrimary }]}>{g.name}</Text>
                  <Text style={[Typography.caption, { color: '#2E9E6B' }]}>🎉 Goal reached! · {fmt(g.targetAmount, sym)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {showAdd && <GoalModal onClose={() => setShowAdd(false)} sym={sym} colors={colors} />}
      {editingGoal && <GoalModal goal={editingGoal} onClose={() => setEditingGoal(null)} sym={sym} colors={colors} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { padding: 4 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hero: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 20 },
  heroAmtRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  heroTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  heroFill: { height: 6, backgroundColor: '#FFF', borderRadius: 3 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden' },
  stripe: { height: 4, width: '100%' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  ringWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  amtRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  cardActions: { gap: 4 },
  actionBtn: { padding: 6 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  timelineTrack: { height: 6, borderRadius: 3, overflow: 'visible', position: 'relative' },
  timelineFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 3 },
  timelineSaved: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: 3 },
  todayDot: { position: 'absolute', top: -4, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFF', transform: [{ translateX: -7 }] },
  timelineLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  ratesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rateGrid: { flexDirection: 'row', gap: 8 },
  rateCell: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  contributeBtn2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 14, paddingVertical: 12 },
  // Modal
  modal: { flex: 1 },
  mHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  mHeaderBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  previewBanner: { borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  formCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  rateCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  rateCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconOption: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  // Contribute
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  contributeSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#D0C8BF', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  contributeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  amtInput: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 14 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickChip: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  contributeBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  // Completed
  completedSection: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  completedHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  countBadge: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  doneRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  doneIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
