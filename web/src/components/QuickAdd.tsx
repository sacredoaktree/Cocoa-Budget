import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, ChevronDown, Check } from 'lucide-react';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { SYSTEM_CATEGORIES } from '@shared/data/categories';
import { symbolForCurrency } from '@shared/utils/currency';
// Map Ionic icon names → emoji for web display
const ICON_EMOJI: Record<string, string> = {
  'card-outline': '💳',
  'restaurant-outline': '🍽️',
  'bus-outline': '🚌',
  'flash-outline': '⚡',
  'happy-outline': '💆',
  'bag-outline': '🛍️',
  'medkit-outline': '🏥',
  'refresh-circle-outline': '🔄',
  'film-outline': '🎬',
  'school-outline': '📚',
  'airplane-outline': '✈️',
  'ellipsis-horizontal-outline': '⋯',
  'laptop-outline': '💻',
  'trending-up-outline': '📈',
  'swap-horizontal-outline': '↔️',
  'cash-outline': '💵',
  'heart-circle-outline': '💝',
  'help-circle-outline': '❓',
};

function categoryEmoji(icon: string): string {
  return ICON_EMOJI[icon] ?? '•';
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

type TxType = 'expense' | 'income';

interface Toast {
  id: number;
  text: string;
}

export default function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [txType, setTxType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('cat-food');
  const [accountId, setAccountId] = useState('');
  const [payee, setPayee] = useState('');
  const [date, setDate] = useState(todayStr);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const allAccounts = useAccountStore((s) => s.accounts);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const accounts = allAccounts.filter((a) => !a.isArchived);
  const { settings } = useSettingsStore();

  const categories = SYSTEM_CATEGORIES.filter(
    (c) => !c.isArchived && c.type === txType
  );

  // Set default account when modal opens (use stable store reference)
  useEffect(() => {
    if (open && !accountId) {
      const first = allAccounts.find((a) => !a.isArchived);
      if (first) setAccountId(first.id);
    }
  }, [open, accountId, allAccounts]);

  // Auto-focus amount on open
  useEffect(() => {
    if (open) {
      setTimeout(() => amountRef.current?.focus(), 50);
    }
  }, [open]);

  // Set default category when type changes
  useEffect(() => {
    const first = SYSTEM_CATEGORIES.find((c) => !c.isArchived && c.type === txType);
    if (first) setCategoryId(first.id);
  }, [txType]);

  const showToast = useCallback((text: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  }, []);

  const handleSave = useCallback(() => {
    const parsed = parseFloat(amount.replace(/,/g, ''));
    if (!parsed || parsed <= 0) {
      amountRef.current?.focus();
      return;
    }
    if (!accountId) return;

    const cents = Math.round(parsed * 100);
    const now = new Date().toISOString();

    addTransaction({
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: txType,
      amount: cents,
      accountId,
      categoryId,
      payee: payee.trim() || (txType === 'expense' ? 'Expense' : 'Income'),
      note: '',
      date,
      time: nowTime(),
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    // Update account balance: deduct for expense, add for income
    const acct = allAccounts.find((a) => a.id === accountId);
    if (acct) {
      const delta = txType === 'expense' ? -cents : cents;
      updateAccount(accountId, { balance: acct.balance + delta });
    }

    const cat = SYSTEM_CATEGORIES.find((c) => c.id === categoryId);
    const emoji = cat ? categoryEmoji(cat.icon) : '';
    showToast(`${emoji} ${txType === 'expense' ? '-' : '+'}${parsed.toFixed(2)} saved`);

    // Reset for next entry (keep modal open for speed)
    setAmount('');
    setPayee('');
    setDate(todayStr());
    setTimeout(() => amountRef.current?.focus(), 50);
  }, [amount, accountId, txType, categoryId, payee, date, addTransaction, updateAccount, allAccounts, showToast]);

  // Keyboard shortcut: Enter to save
  const handleAmountKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') setOpen(false);
    },
    [handleSave]
  );

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currSymbol = selectedAccount
    ? symbolForCurrency(selectedAccount.currency)
    : symbolForCurrency(settings.currency);

  return (
    <>
      {/* ── Toasts ─────────────────────────────────────────────────────── */}
      <div className="fixed bottom-24 md:bottom-6 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-cocoa-primary text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg animate-fade-in"
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* ── FAB ────────────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: '#C8956A' }}
        aria-label="Add transaction"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* ── Modal backdrop ─────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Add Transaction</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* Expense / Income toggle */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-semibold">
                <button
                  onClick={() => setTxType('expense')}
                  className={`flex-1 py-2.5 transition-colors ${
                    txType === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setTxType('income')}
                  className={`flex-1 py-2.5 transition-colors ${
                    txType === 'income'
                      ? 'text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                  style={txType === 'income' ? { backgroundColor: '#2E9E6B' } : {}}
                >
                  Income
                </button>
              </div>

              {/* Amount — big, front and center */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                  {currSymbol}
                </span>
                <input
                  ref={amountRef}
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={handleAmountKeyDown}
                  className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-gray-900 bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none"
                  style={{ '--tw-ring-color': '#C8956A' } as React.CSSProperties}
                />
              </div>

              {/* Category grid */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Category</p>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${
                        categoryId === cat.id
                          ? 'border-cocoa-accent bg-cocoa-bg'
                          : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-xl leading-none">{categoryEmoji(cat.icon)}</span>
                      <span className="text-[10px] font-medium text-gray-600 leading-tight line-clamp-2">
                        {cat.name}
                      </span>
                      {categoryId === cat.id && (
                        <Check size={10} className="text-cocoa-accent" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account selector */}
              {accounts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Account</p>
                  <div className="relative">
                    <button
                      onClick={() => setShowAccountPicker((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: selectedAccount?.color ?? '#C8956A' }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {selectedAccount?.name ?? 'Select account'}
                        </span>
                        {selectedAccount && (
                          <span className="text-xs text-gray-400">
                            {symbolForCurrency(selectedAccount.currency)}
                            {(Math.abs(selectedAccount.balance) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAccountPicker ? 'rotate-180' : ''}`} />
                    </button>

                    {showAccountPicker && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
                        {accounts.map((acc) => (
                          <button
                            key={acc.id}
                            onClick={() => { setAccountId(acc.id); setShowAccountPicker(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                              acc.id === accountId ? 'bg-cocoa-bg' : ''
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: acc.color }}
                            />
                            <span className="flex-1 text-sm font-medium text-gray-900">{acc.name}</span>
                            <span className="text-xs text-gray-400">
                              {symbolForCurrency(acc.currency)}
                              {(Math.abs(acc.balance) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {acc.id === accountId && <Check size={14} className="text-cocoa-accent" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No accounts warning */}
              {accounts.length === 0 && (
                <div className="text-center py-3 px-4 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-700 font-medium">Add an account first to log transactions.</p>
                </div>
              )}

              {/* Payee + Date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Payee / Description</p>
                  <input
                    type="text"
                    placeholder="e.g. Jollibee"
                    value={payee}
                    onChange={(e) => setPayee(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date</p>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-2 flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={!amount || !accountId}
                className="flex-2 py-3 px-8 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#C8956A', flex: 2 }}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
