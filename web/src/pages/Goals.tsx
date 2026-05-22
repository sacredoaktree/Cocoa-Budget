import { useState } from 'react';
import { Plus, Target, CheckCircle, X, Trash2 } from 'lucide-react';
import { useSavingsGoalStore } from '@shared/store/useSavingsGoalStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { formatCurrency } from '@shared/utils/currency';
import { formatDate } from '@shared/utils/date';
import type { SavingsGoal } from '@shared/types';

// ── Icon / Color options ─────────────────────────────────────────────────────
const GOAL_ICONS = [
  { key: 'shield', emoji: '🛡️' },
  { key: 'airplane', emoji: '✈️' },
  { key: 'laptop', emoji: '💻' },
  { key: 'home', emoji: '🏠' },
  { key: 'car', emoji: '🚗' },
  { key: 'ring', emoji: '💍' },
  { key: 'baby', emoji: '👶' },
  { key: 'star', emoji: '⭐' },
];

const GOAL_COLORS = [
  '#2E9E6B', '#4A90D9', '#8B5CF6', '#D94F3D',
  '#E88C2A', '#D4AF37', '#C8956A', '#EC4899',
];

const ICON_EMOJI_MAP: Record<string, string> = {
  'shield-checkmark-outline': '🛡️',
  'airplane-outline': '✈️',
  'laptop-outline': '💻',
  'home-outline': '🏠',
  'car-outline': '🚗',
  'diamond-outline': '💍',
  'baby-outline': '👶',
  'star-outline': '⭐',
  shield: '🛡️',
  airplane: '✈️',
  laptop: '💻',
  home: '🏠',
  car: '🚗',
  ring: '💍',
  baby: '👶',
  star: '⭐',
};

function getEmoji(icon: string): string {
  return ICON_EMOJI_MAP[icon] ?? '🎯';
}

// ── Circular Progress Ring ────────────────────────────────────────────────────
function ProgressRing({
  percent,
  color,
  size = 80,
}: {
  percent: number;
  color: string;
  size?: number;
}) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#EAE6E1"
        strokeWidth={8}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// ── Add Goal Modal ─────────────────────────────────────────────────────────────
interface AddGoalModalProps {
  onClose: () => void;
  symbol: string;
}

function AddGoalModal({ onClose, symbol }: AddGoalModalProps) {
  const { addGoal } = useSavingsGoalStore();

  const [name, setName] = useState('');
  const [targetRaw, setTargetRaw] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [selectedColor, setSelectedColor] = useState('#C8956A');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Math.round(parseFloat(targetRaw) * 100);
    if (!name.trim()) { setError('Name is required'); return; }
    if (isNaN(target) || target <= 0) { setError('Enter a valid target amount'); return; }
    if (!deadline) { setError('Deadline is required'); return; }

    const goal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      targetAmount: target,
      currentAmount: 0,
      deadline,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addGoal(goal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-cocoa-text1">New Savings Goal</h2>
          <button onClick={onClose} className="p-1 text-cocoa-text3 hover:text-cocoa-text1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">
              Goal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund"
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
            />
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">
              Target Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm font-medium">
                {symbol}
              </span>
              <input
                type="number"
                value={targetRaw}
                onChange={(e) => setTargetRaw(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-8 pr-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">
              Target Date
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm text-cocoa-text1 focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
            />
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-2 uppercase tracking-wide">
              Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_ICONS.map(({ key, emoji }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedIcon(key)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all border-2 ${
                    selectedIcon === key
                      ? 'border-cocoa-accent bg-cocoa-accent/10 scale-110'
                      : 'border-transparent bg-cocoa-input hover:border-cocoa-divider'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-2 uppercase tracking-wide">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === c
                      ? 'scale-125 ring-2 ring-offset-2 ring-cocoa-accent'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-cocoa-expense font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: selectedColor }}
          >
            Create Goal
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, symbol }: { goal: SavingsGoal; symbol: string }) {
  const { deleteGoal } = useSavingsGoalStore();

  const percent = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;

  const now = new Date();
  const deadlineDate = new Date(goal.deadline + 'T00:00:00');
  const msLeft = deadlineDate.getTime() - now.getTime();
  const monthsLeft = Math.max(Math.ceil(msLeft / (1000 * 60 * 60 * 24 * 30.44)), 1);
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const monthlyNeeded = remaining > 0 ? Math.ceil(remaining / monthsLeft) : 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-cocoa-divider">
      <div className="flex items-start gap-4">
        {/* Progress Ring + Icon */}
        <div className="relative flex-shrink-0">
          <ProgressRing percent={percent} color={goal.color} size={72} />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">
            {getEmoji(goal.icon)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-cocoa-text1 text-base leading-tight">{goal.name}</h3>
              <p className="text-xs text-cocoa-text3 mt-0.5">
                Due {formatDate(goal.deadline, 'MMM yyyy')}
              </p>
            </div>
            <button
              onClick={() => deleteGoal(goal.id)}
              className="text-cocoa-text3 hover:text-cocoa-expense p-1 flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-cocoa-divider rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%`, backgroundColor: goal.color }}
            />
          </div>

          {/* Amounts */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-cocoa-text1">
              {formatCurrency(goal.currentAmount, symbol)}
            </span>
            <span className="text-xs text-cocoa-text3">
              of {formatCurrency(goal.targetAmount, symbol)}
            </span>
          </div>

          {/* Monthly needed chip */}
          {monthlyNeeded > 0 && (
            <div className="mt-2">
              <span
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: goal.color }}
              >
                {formatCurrency(monthlyNeeded, symbol)}/mo needed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Completed Goal Row ────────────────────────────────────────────────────────
function CompletedGoalRow({ goal, symbol }: { goal: SavingsGoal; symbol: string }) {
  const { deleteGoal } = useSavingsGoalStore();
  return (
    <div className="flex items-center gap-3 py-3 border-b border-cocoa-divider last:border-0">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: goal.color + '22' }}
      >
        {getEmoji(goal.icon)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-cocoa-text1 truncate">{goal.name}</p>
        <p className="text-xs text-cocoa-text3">
          Completed · {formatCurrency(goal.targetAmount, symbol)}
        </p>
      </div>
      <CheckCircle size={18} className="text-cocoa-income flex-shrink-0" />
      <button
        onClick={() => deleteGoal(goal.id)}
        className="text-cocoa-text3 hover:text-cocoa-expense p-1"
      >
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
  const [showModal, setShowModal] = useState(false);

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  const totalSaved = activeGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPercent = totalTarget > 0
    ? Math.min((totalSaved / totalTarget) * 100, 100)
    : 0;

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
            {activeGoals.length} active · {completedGoals.length} completed
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-cocoa-accent hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      {/* Summary card */}
      {activeGoals.length > 0 && (
        <div className="bg-gradient-to-br from-cocoa-primary to-cocoa-accent/80 rounded-2xl p-5 mb-6 text-white">
          <p className="text-sm text-white/70 mb-1">Overall Progress</p>
          <div className="flex items-end justify-between mb-3">
            <span className="text-2xl font-bold">{formatCurrency(totalSaved, symbol)}</span>
            <span className="text-sm text-white/70">of {formatCurrency(totalTarget, symbol)}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <p className="text-xs text-white/60 mt-1.5">{overallPercent.toFixed(1)}% of total goal</p>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length === 0 ? (
        <div className="text-center py-16 text-cocoa-text3">
          <Target size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No active goals yet</p>
          <p className="text-sm mt-1">Tap "Add Goal" to create your first savings goal</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} symbol={symbol} />
          ))}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-cocoa-divider overflow-hidden">
          <div className="px-5 py-4 border-b border-cocoa-divider flex items-center gap-2">
            <CheckCircle size={18} className="text-cocoa-income" />
            <h2 className="font-semibold text-cocoa-text1">Completed Goals</h2>
            <span className="ml-auto text-xs text-cocoa-text3 bg-cocoa-input px-2 py-0.5 rounded-full">
              {completedGoals.length}
            </span>
          </div>
          <div className="px-5">
            {completedGoals.map((goal) => (
              <CompletedGoalRow key={goal.id} goal={goal} symbol={symbol} />
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddGoalModal onClose={() => setShowModal(false)} symbol={symbol} />
      )}
    </div>
  );
}
