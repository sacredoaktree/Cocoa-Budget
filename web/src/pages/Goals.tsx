import { useState } from 'react';
import {
  Plus, Target, CheckCircle, X, Trash2, Edit3,
  Calendar, Zap, TrendingUp, TrendingDown, AlertCircle,
} from 'lucide-react';
import { useSavingsGoalStore } from '@shared/store/useSavingsGoalStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { formatCurrency } from '@shared/utils/currency';
import type { SavingsGoal } from '@shared/types';

// ── Constants ────────────────────────────────────────────────────────────────
const GOAL_ICONS = [
  { key: 'shield', emoji: '🛡️' },
  { key: 'airplane', emoji: '✈️' },
  { key: 'laptop', emoji: '💻' },
  { key: 'home', emoji: '🏠' },
  { key: 'car', emoji: '🚗' },
  { key: 'ring', emoji: '💍' },
  { key: 'baby', emoji: '👶' },
  { key: 'star', emoji: '⭐' },
  { key: 'graduation', emoji: '🎓' },
  { key: 'beach', emoji: '🏖️' },
  { key: 'health', emoji: '❤️' },
  { key: 'gift', emoji: '🎁' },
];

const GOAL_COLORS = [
  '#2E9E6B', '#4A90D9', '#8B5CF6', '#D94F3D',
  '#E88C2A', '#D4AF37', '#C8956A', '#EC4899',
  '#06B6D4', '#10B981', '#F43F5E', '#6366F1',
];

const ICON_EMOJI_MAP: Record<string, string> = {
  'shield-checkmark-outline': '🛡️', 'airplane-outline': '✈️', 'laptop-outline': '💻',
  'home-outline': '🏠', 'car-outline': '🚗', 'diamond-outline': '💍',
  'baby-outline': '👶', 'star-outline': '⭐', 'school-outline': '🎓',
  shield: '🛡️', airplane: '✈️', laptop: '💻', home: '🏠',
  car: '🚗', ring: '💍', baby: '👶', star: '⭐',
  graduation: '🎓', beach: '🏖️', health: '❤️', gift: '🎁',
};

function getEmoji(icon: string) { return ICON_EMOJI_MAP[icon] ?? '🎯'; }

function calcRates(remaining: number, daysLeft: number) {
  if (daysLeft <= 0 || remaining <= 0) return { daily: 0, weekly: 0, biweekly: 0, monthly: 0 };
  const daily = remaining / daysLeft;
  return {
    daily,
    weekly:   daysLeft >= 7     ? daily * 7     : remaining,
    biweekly: daysLeft >= 14    ? daily * 14    : remaining,
    monthly:  daysLeft >= 30.44 ? daily * 30.44 : remaining,
  };
}

// ── Progress Ring ─────────────────────────────────────────────────────────────
function ProgressRing({ percent, color, size = 80, trackColor = '#EAE6E1' }: {
  percent: number; color: string; size?: number; trackColor?: string;
}) {
  const sw = size > 90 ? 10 : 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={sw} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

// ── Savings Rate Grid ─────────────────────────────────────────────────────────
function RateGrid({ rates, symbol, color }: {
  rates: { daily: number; weekly: number; biweekly: number; monthly: number };
  symbol: string;
  color?: string;
}) {
  const items = [
    { label: 'Daily', value: rates.daily },
    { label: 'Weekly', value: rates.weekly },
    { label: 'Bi-weekly', value: rates.biweekly },
    { label: 'Monthly', value: rates.monthly },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-cocoa-input rounded-xl p-2 text-center">
          <p className="text-[10px] text-cocoa-text3 mb-0.5">{label}</p>
          <p className="text-xs font-bold" style={{ color: color ?? '#1A1008' }}>
            {formatCurrency(Math.round(value), symbol)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Goal Modal (Add / Edit) ───────────────────────────────────────────────────
interface GoalModalProps { goal?: SavingsGoal; onClose: () => void; symbol: string; }

function GoalModal({ goal, onClose, symbol }: GoalModalProps) {
  const { addGoal, updateGoal } = useSavingsGoalStore();
  const isEdit = !!goal;

  const [name, setName] = useState(goal?.name ?? '');
  const [targetRaw, setTargetRaw] = useState(goal ? String(goal.targetAmount / 100) : '');
  const [savedRaw, setSavedRaw] = useState(goal ? String(goal.currentAmount / 100) : '0');
  const [deadline, setDeadline] = useState(goal?.deadline ?? '');
  const [icon, setIcon] = useState(goal?.icon ?? 'star');
  const [color, setColor] = useState(goal?.color ?? '#C8956A');
  const [error, setError] = useState('');

  const targetCents = Math.round((parseFloat(targetRaw) || 0) * 100);
  const savedCents = Math.round((parseFloat(savedRaw) || 0) * 100);
  const remaining = Math.max(targetCents - savedCents, 0);
  const daysLeft = deadline
    ? Math.max(Math.ceil((new Date(deadline + 'T00:00:00').getTime() - Date.now()) / 86400000), 0)
    : 0;
  const rates = calcRates(remaining, daysLeft);
  const percent = targetCents > 0 ? Math.min((savedCents / targetCents) * 100, 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Goal name is required'); return; }
    if (!targetCents || targetCents <= 0) { setError('Enter a valid target amount'); return; }
    if (!deadline) { setError('Target date is required'); return; }

    const now = new Date().toISOString();
    if (isEdit && goal) {
      updateGoal(goal.id, {
        name: name.trim(), icon, color,
        targetAmount: targetCents, currentAmount: savedCents, deadline,
        isCompleted: savedCents >= targetCents,
      });
    } else {
      addGoal({
        id: `goal-${Date.now()}`, name: name.trim(), icon, color,
        targetAmount: targetCents, currentAmount: savedCents, deadline,
        isCompleted: savedCents >= targetCents, createdAt: now, updatedAt: now,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md shadow-2xl max-h-[92vh] flex flex-col">
        {/* Live-preview header */}
        <div className="relative rounded-t-3xl px-6 pt-6 pb-8 flex-shrink-0" style={{ backgroundColor: color }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-1">
            <X size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ProgressRing percent={percent} color="rgba(255,255,255,0.35)" trackColor="rgba(255,255,255,0.15)" size={72} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl leading-none">{getEmoji(icon)}</span>
                <span className="text-[10px] font-bold text-white/80">{Math.round(percent)}%</span>
              </div>
            </div>
            <div>
              <p className="text-white/60 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
                {isEdit ? 'Edit Goal' : 'New Goal'}
              </p>
              <p className="text-white text-xl font-bold leading-tight">{name || 'My Goal'}</p>
              {deadline && (
                <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                  <Calendar size={10} />
                  {daysLeft > 0 ? `${daysLeft} days to go` : 'Deadline reached'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Goal Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Emergency Fund"
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Target Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm">{symbol}</span>
                  <input type="number" value={targetRaw} onChange={(e) => setTargetRaw(e.target.value)}
                    placeholder="0.00" min="1" step="0.01"
                    className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-7 pr-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Already Saved</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm">{symbol}</span>
                  <input type="number" value={savedRaw} onChange={(e) => setSavedRaw(e.target.value)}
                    placeholder="0.00" min="0" step="0.01"
                    className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-7 pr-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
                </div>
              </div>
            </div>

            {/* Target date */}
            <div>
              <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Target Date</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
            </div>

            {/* Live savings calculator */}
            {remaining > 0 && daysLeft > 0 && (
              <div className="rounded-2xl overflow-hidden border border-cocoa-divider">
                <div className="px-4 py-2.5 flex items-center gap-1.5" style={{ backgroundColor: color + '15' }}>
                  <Zap size={13} style={{ color }} />
                  <span className="text-xs font-semibold" style={{ color }}>
                    Save this much to reach your goal on time
                  </span>
                </div>
                <div className="p-3">
                  <RateGrid rates={rates} symbol={symbol} color={color} />
                </div>
              </div>
            )}

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-semibold text-cocoa-text2 mb-2 uppercase tracking-wide">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_ICONS.map(({ key, emoji }) => (
                  <button key={key} type="button" onClick={() => setIcon(key)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all border-2 ${
                      icon === key ? 'scale-110' : 'border-transparent bg-cocoa-input hover:border-cocoa-divider'
                    }`}
                    style={icon === key ? { borderColor: color, backgroundColor: color + '18' } : {}}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-semibold text-cocoa-text2 mb-2 uppercase tracking-wide">Color</label>
              <div className="flex gap-2 flex-wrap">
                {GOAL_COLORS.map((c) => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'scale-125 ring-2 ring-offset-2' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c, ...(color === c ? { ringColor: c } : {}) }} />
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-cocoa-expense font-medium">{error}</p>}

            <button type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: color }}>
              {isEdit ? 'Save Changes' : 'Create Goal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Contribute Modal ──────────────────────────────────────────────────────────
function ContributeModal({ goal, onClose, symbol }: { goal: SavingsGoal; onClose: () => void; symbol: string }) {
  const { contribute } = useSavingsGoalStore();
  const [amountRaw, setAmountRaw] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = Math.round(parseFloat(amountRaw) * 100);
    if (!cents || cents <= 0) return;
    contribute(goal.id, cents);
    onClose();
  };

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 text-center" style={{ background: `linear-gradient(135deg, ${goal.color}22, ${goal.color}08)` }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-cocoa-text3 hover:text-cocoa-text1 p-1">
            <X size={20} />
          </button>
          <div className="relative w-16 h-16 mx-auto mb-3">
            <ProgressRing
              percent={goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0}
              color={goal.color} size={64} />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">{getEmoji(goal.icon)}</span>
          </div>
          <p className="font-bold text-cocoa-text1 text-base">{goal.name}</p>
          <p className="text-xs text-cocoa-text3 mt-0.5">{formatCurrency(remaining, symbol)} remaining</p>
        </div>

        <div className="px-6 pb-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cocoa-text2 font-bold text-lg">{symbol}</span>
              <input type="number" value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)}
                placeholder="0.00" min="0.01" step="0.01" autoFocus
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-2xl pl-10 pr-4 py-4 text-2xl font-bold text-cocoa-text1 text-center focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {[10, 50, 100, 500].map((v) => (
                <button key={v} type="button"
                  onClick={() => setAmountRaw(String(v))}
                  className="py-2 text-xs font-semibold bg-cocoa-input text-cocoa-text2 rounded-xl hover:bg-cocoa-divider transition-colors">
                  {symbol}{v}
                </button>
              ))}
            </div>

            <button type="submit"
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: goal.color }}>
              {amountRaw && parseFloat(amountRaw) > 0
                ? `Add ${formatCurrency(Math.round(parseFloat(amountRaw) * 100), symbol)}`
                : 'Add Contribution'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, symbol, onEdit }: { goal: SavingsGoal; symbol: string; onEdit: () => void }) {
  const { deleteGoal } = useSavingsGoalStore();
  const [showContribute, setShowContribute] = useState(false);

  const now = Date.now();
  const createdAt = new Date(goal.createdAt).getTime();
  const deadlineTs = new Date(goal.deadline + 'T00:00:00').getTime();
  const daysLeft = Math.max(Math.ceil((deadlineTs - now) / 86400000), 0);
  const totalSpan = Math.max(deadlineTs - createdAt, 1);
  const timeElapsedPct = Math.min(Math.max(((now - createdAt) / totalSpan) * 100, 0), 100);

  const percent = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const rates = calcRates(remaining, daysLeft);

  const isCompleted = goal.isCompleted || percent >= 100;
  const isOverdue = !isCompleted && daysLeft === 0;
  const isBehind = !isCompleted && !isOverdue && percent < timeElapsedPct - 5;
  const isAhead = !isCompleted && !isOverdue && percent > timeElapsedPct + 5;

  const statusColor = isCompleted ? '#2E9E6B'
    : isOverdue ? '#D94F3D'
    : isBehind ? '#E88C2A'
    : '#2E9E6B';

  const StatusIcon = isCompleted ? CheckCircle : isOverdue ? AlertCircle : isBehind ? TrendingDown : TrendingUp;
  const statusLabel = isCompleted ? 'Completed'
    : isOverdue ? 'Overdue'
    : isBehind ? 'Behind'
    : isAhead ? 'Ahead' : 'On track';

  const deadlineLabel = new Date(goal.deadline + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-cocoa-divider overflow-hidden">
        {/* Color top stripe */}
        <div className="h-1 w-full" style={{ backgroundColor: goal.color }} />

        <div className="p-5">
          {/* Top row: ring + info + actions */}
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <ProgressRing percent={percent} color={goal.color} size={80} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl leading-none">{getEmoji(goal.icon)}</span>
                <span className="text-[10px] font-bold mt-0.5" style={{ color: goal.color }}>
                  {Math.round(percent)}%
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3 className="font-bold text-cocoa-text1 text-base truncate">{goal.name}</h3>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: statusColor + '18', color: statusColor }}>
                  <StatusIcon size={9} />
                  {statusLabel}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-cocoa-text3 mb-2">
                <Calendar size={10} />
                <span>{deadlineLabel}</span>
                {daysLeft > 0 && !isCompleted && (
                  <span className="text-cocoa-text3">· {daysLeft}d left</span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-cocoa-text1">
                  {formatCurrency(goal.currentAmount, symbol)}
                </span>
                <span className="text-xs text-cocoa-text3">
                  of {formatCurrency(goal.targetAmount, symbol)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={onEdit}
                className="p-1.5 text-cocoa-text3 hover:text-cocoa-text1 hover:bg-cocoa-input rounded-lg transition-colors">
                <Edit3 size={14} />
              </button>
              <button onClick={() => deleteGoal(goal.id)}
                className="p-1.5 text-cocoa-text3 hover:text-cocoa-expense hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Savings progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-cocoa-text3 mb-1.5">
              <span>Saved</span>
              <span>{formatCurrency(remaining, symbol)} to go</span>
            </div>
            <div className="h-2 bg-cocoa-divider rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${percent}%`, backgroundColor: goal.color }} />
            </div>
          </div>

          {/* Timeline */}
          {!isCompleted && (
            <div className="mt-4">
              <p className="text-[10px] font-semibold text-cocoa-text3 uppercase tracking-wide mb-2">Timeline</p>
              <div className="relative h-2 bg-cocoa-divider rounded-full">
                {/* Time elapsed */}
                <div className="absolute inset-y-0 left-0 rounded-full bg-gray-200"
                  style={{ width: `${timeElapsedPct}%` }} />
                {/* Savings progress on timeline */}
                <div className="absolute inset-y-0 left-0 rounded-full opacity-60"
                  style={{ width: `${percent}%`, backgroundColor: goal.color }} />
                {/* Today marker */}
                {timeElapsedPct > 2 && timeElapsedPct < 98 && (
                  <div className="absolute top-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow"
                    style={{
                      left: `${timeElapsedPct}%`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: '#8A7A68',
                    }} />
                )}
              </div>
              <div className="flex justify-between text-[10px] text-cocoa-text3 mt-1">
                <span>Start</span>
                <span className="flex items-center gap-0.5"><Calendar size={9} /> Today</span>
                <span>Deadline</span>
              </div>
            </div>
          )}

          {/* Savings rates */}
          {remaining > 0 && daysLeft > 0 && (
            <div className="mt-4 pt-4 border-t border-cocoa-divider">
              <p className="text-[11px] font-semibold text-cocoa-text3 uppercase tracking-wide mb-2.5 flex items-center gap-1">
                <Zap size={11} /> How much to save per period
              </p>
              <RateGrid rates={rates} symbol={symbol} color={goal.color} />
            </div>
          )}

          {/* CTA */}
          {!isCompleted && (
            <button onClick={() => setShowContribute(true)}
              className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: goal.color }}>
              <Plus size={15} />
              Add Contribution
            </button>
          )}
        </div>
      </div>

      {showContribute && (
        <ContributeModal goal={goal} onClose={() => setShowContribute(false)} symbol={symbol} />
      )}
    </>
  );
}

// ── Completed Row ─────────────────────────────────────────────────────────────
function CompletedRow({ goal, symbol }: { goal: SavingsGoal; symbol: string }) {
  const { deleteGoal } = useSavingsGoalStore();
  return (
    <div className="flex items-center gap-3 py-3 border-b border-cocoa-divider last:border-0">
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: goal.color + '22' }}>
        {getEmoji(goal.icon)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-cocoa-text1 truncate">{goal.name}</p>
        <p className="text-xs text-cocoa-income font-medium">🎉 Goal reached · {formatCurrency(goal.targetAmount, symbol)}</p>
      </div>
      <CheckCircle size={16} className="text-cocoa-income flex-shrink-0" />
      <button onClick={() => deleteGoal(goal.id)} className="text-cocoa-text3 hover:text-cocoa-expense p-1">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Goals() {
  const { goals } = useSavingsGoalStore();
  const { settings } = useSettingsStore();
  const symbol = settings.currencySymbol;
  const [showAdd, setShowAdd] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);

  const totalSaved = active.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = active.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cocoa-text1 flex items-center gap-2">
            <Target size={24} className="text-cocoa-accent" />
            Savings Goals
          </h1>
          <p className="text-sm text-cocoa-text2 mt-0.5">
            {active.length} active · {completed.length} completed
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-cocoa-accent hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      {/* Summary hero */}
      {active.length > 0 && (
        <div className="bg-gradient-to-br from-cocoa-primary to-cocoa-accent/80 rounded-2xl p-5 mb-6 text-white">
          <p className="text-sm text-white/70 mb-1">Total Progress</p>
          <div className="flex items-end justify-between mb-3">
            <span className="text-2xl font-bold">{formatCurrency(totalSaved, symbol)}</span>
            <span className="text-sm text-white/70">of {formatCurrency(totalTarget, symbol)}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
          </div>
          <p className="text-xs text-white/60 mt-1.5">{overallPct.toFixed(1)}% across all active goals</p>
        </div>
      )}

      {/* Active goals */}
      {active.length === 0 ? (
        <div className="text-center py-20 text-cocoa-text3">
          <Target size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-base">No active goals yet</p>
          <p className="text-sm mt-1 mb-6">Create your first goal and see your savings plan come to life</p>
          <button onClick={() => setShowAdd(true)}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold bg-cocoa-accent hover:opacity-90 transition-opacity">
            Create a Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {active.map((goal) => (
            <GoalCard key={goal.id} goal={goal} symbol={symbol} onEdit={() => setEditingGoal(goal)} />
          ))}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-cocoa-divider overflow-hidden">
          <div className="px-5 py-4 border-b border-cocoa-divider flex items-center gap-2">
            <CheckCircle size={16} className="text-cocoa-income" />
            <h2 className="font-semibold text-cocoa-text1 text-sm">Completed Goals</h2>
            <span className="ml-auto text-xs text-cocoa-text3 bg-cocoa-input px-2 py-0.5 rounded-full">
              {completed.length}
            </span>
          </div>
          <div className="px-5">
            {completed.map((g) => <CompletedRow key={g.id} goal={g} symbol={symbol} />)}
          </div>
        </div>
      )}

      {showAdd && <GoalModal onClose={() => setShowAdd(false)} symbol={symbol} />}
      {editingGoal && <GoalModal goal={editingGoal} onClose={() => setEditingGoal(null)} symbol={symbol} />}
    </div>
  );
}
