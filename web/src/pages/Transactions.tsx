import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Pencil, Trash2, X, ChevronDown, Check } from 'lucide-react';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { SYSTEM_CATEGORIES } from '@shared/data/categories';
import {
  currentMonth, prevMonth, nextMonth, monthLabel, formatGroupDate, formatTime,
} from '@shared/utils/date';
import { formatCurrency, symbolForCurrency } from '@shared/utils/currency';
import type { Transaction } from '@shared/types';

const ICON_EMOJI: Record<string, string> = {
  'card-outline': '💳', 'restaurant-outline': '🍽️', 'bus-outline': '🚌',
  'flash-outline': '⚡', 'happy-outline': '💆', 'bag-outline': '🛍️',
  'medkit-outline': '🏥', 'refresh-circle-outline': '🔄', 'film-outline': '🎬',
  'school-outline': '📚', 'airplane-outline': '✈️', 'ellipsis-horizontal-outline': '⋯',
  'laptop-outline': '💻', 'trending-up-outline': '📈', 'swap-horizontal-outline': '↔️',
  'cash-outline': '💵', 'heart-circle-outline': '💝', 'help-circle-outline': '❓',
  'add-circle-outline': '➕',
};
function catEmoji(icon: string) { return ICON_EMOJI[icon] ?? '•'; }

// ── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  tx,
  onClose,
}: {
  tx: Transaction;
  onClose: () => void;
}) {
  const [txType, setTxType]     = useState<'expense' | 'income'>(tx.type === 'income' ? 'income' : 'expense');
  const [amount, setAmount]     = useState((tx.amount / 100).toFixed(2));
  const [categoryId, setCatId]  = useState(tx.categoryId);
  const [accountId, setAcctId]  = useState(tx.accountId);
  const [payee, setPayee]       = useState(tx.payee);
  const [note, setNote]         = useState(tx.note);
  const [date, setDate]         = useState(tx.date);
  const [showAcctPicker, setShowAcctPicker] = useState(false);
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const allAccounts       = useAccountStore((s) => s.accounts);
  const updateAccount     = useAccountStore((s) => s.updateAccount);
  const { settings }      = useSettingsStore();

  const accounts = allAccounts.filter((a) => !a.isArchived);
  const selectedAcct = accounts.find((a) => a.id === accountId);

  // When type changes, pick first matching category
  useEffect(() => {
    const first = SYSTEM_CATEGORIES.find((c) => !c.isArchived && c.type === txType);
    if (first && !SYSTEM_CATEGORIES.find((c) => c.id === categoryId && c.type === txType)) {
      setCatId(first.id);
    }
  }, [txType, categoryId]);

  const handleSave = useCallback(() => {
    const parsed = parseFloat(amount.replace(/,/g, ''));
    if (!parsed || parsed <= 0 || !accountId) { amountRef.current?.focus(); return; }
    const newCents = Math.round(parsed * 100);

    // ── Reverse old transaction from old account ──────────────────
    const oldAcct = allAccounts.find((a) => a.id === tx.accountId);
    if (oldAcct) {
      const reversal = tx.type === 'expense' ? tx.amount : -tx.amount;
      updateAccount(tx.accountId, { balance: oldAcct.balance + reversal });
    }

    // ── Apply new transaction to new account ──────────────────────
    const newAcct = allAccounts.find((a) => a.id === accountId);
    if (newAcct) {
      // If same account, the balance was already reversed above; use its updated value
      const baseBalance = tx.accountId === accountId
        ? (oldAcct ? oldAcct.balance + (tx.type === 'expense' ? tx.amount : -tx.amount) : newAcct.balance)
        : newAcct.balance;
      const delta = txType === 'expense' ? -newCents : newCents;
      updateAccount(accountId, { balance: baseBalance + delta });
    }

    updateTransaction(tx.id, {
      type: txType,
      amount: newCents,
      accountId,
      categoryId,
      payee: payee.trim() || (txType === 'expense' ? 'Expense' : 'Income'),
      note: note.trim(),
      date,
    });
    onClose();
  }, [amount, txType, accountId, categoryId, payee, note, date, tx, allAccounts, updateAccount, updateTransaction, onClose]);

  const handleDelete = useCallback(() => {
    // Reverse balance effect
    const oldAcct = allAccounts.find((a) => a.id === tx.accountId);
    if (oldAcct) {
      const reversal = tx.type === 'expense' ? tx.amount : -tx.amount;
      updateAccount(tx.accountId, { balance: oldAcct.balance + reversal });
    }
    deleteTransaction(tx.id);
    onClose();
  }, [tx, allAccounts, updateAccount, deleteTransaction, onClose]);

  const categories = SYSTEM_CATEGORIES.filter((c) => !c.isArchived && c.type === txType);
  const currSymbol = selectedAcct ? symbolForCurrency(selectedAcct.currency) : symbolForCurrency(settings.currency);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Edit Transaction</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-semibold">
            <button onClick={() => setTxType('expense')}
              className={`flex-1 py-2.5 transition-colors ${txType === 'expense' ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Expense
            </button>
            <button onClick={() => setTxType('income')}
              className={`flex-1 py-2.5 transition-colors ${txType === 'income' ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              style={txType === 'income' ? { backgroundColor: '#2E9E6B' } : {}}>
              Income
            </button>
          </div>

          {/* Amount */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">{currSymbol}</span>
            <input ref={amountRef} type="number" inputMode="decimal" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
              className="w-full pl-10 pr-4 py-4 text-3xl font-bold text-gray-900 bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none" />
          </div>

          {/* Category grid */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setCatId(cat.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${
                    categoryId === cat.id ? 'border-cocoa-accent bg-cocoa-bg' : 'border-transparent hover:bg-gray-50'
                  }`}>
                  <span className="text-xl leading-none">{catEmoji(cat.icon)}</span>
                  <span className="text-[10px] font-medium text-gray-600 leading-tight line-clamp-2">{cat.name}</span>
                  {categoryId === cat.id && <Check size={10} className="text-cocoa-accent" />}
                </button>
              ))}
            </div>
          </div>

          {/* Account selector */}
          {accounts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Account</p>
              <div className="relative">
                <button onClick={() => setShowAcctPicker((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedAcct?.color ?? '#C8956A' }} />
                    <span className="text-sm font-medium text-gray-900">{selectedAcct?.name ?? 'Select account'}</span>
                    {selectedAcct && (
                      <span className="text-xs text-gray-400">
                        {symbolForCurrency(selectedAcct.currency)}{(Math.abs(selectedAcct.balance) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAcctPicker ? 'rotate-180' : ''}`} />
                </button>
                {showAcctPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
                    {accounts.map((acc) => (
                      <button key={acc.id} onClick={() => { setAcctId(acc.id); setShowAcctPicker(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${acc.id === accountId ? 'bg-cocoa-bg' : ''}`}>
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: acc.color }} />
                        <span className="flex-1 text-sm font-medium text-gray-900">{acc.name}</span>
                        <span className="text-xs text-gray-400">
                          {symbolForCurrency(acc.currency)}{(Math.abs(acc.balance) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        {acc.id === accountId && <Check size={14} className="text-cocoa-accent" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payee + Note + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Payee</p>
              <input type="text" value={payee} onChange={(e) => setPayee(e.target.value)}
                placeholder="e.g. Jollibee"
                className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Date</p>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Note (optional)</p>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border-2 border-transparent focus:border-cocoa-accent focus:outline-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-2 space-y-2">
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!amount || !accountId}
              className="py-3 px-8 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
              style={{ flex: 2, backgroundColor: '#C8956A' }}>
              Save Changes
            </button>
          </div>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
              <Trash2 size={15} /> Delete Transaction
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100">
                Keep it
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600">
                Yes, Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Transactions page ────────────────────────────────────────────────────────
export default function Transactions() {
  const [month, setMonth]         = useState(currentMonth());
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const allTransactions   = useTransactionStore((s) => s.transactions);
  const getMonthlyIncome  = useTransactionStore((s) => s.getMonthlyIncome);
  const getMonthlyExpense = useTransactionStore((s) => s.getMonthlyExpense);
  const { settings }      = useSettingsStore();
  const symbol            = settings.currencySymbol;

  const transactions = allTransactions.filter((t) => !t.isDeleted && t.date.startsWith(month));
  const income       = getMonthlyIncome(month);
  const expense      = getMonthlyExpense(month);
  const balance      = income - expense;

  // Group by date, newest first
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  for (const d of sortedDates) grouped[d].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="min-h-screen bg-gray-50">
      {editingTx && <EditModal tx={editingTx} onClose={() => setEditingTx(null)} />}

      {/* Month Navigator */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMonth(prevMonth(month))} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="text-base font-semibold text-gray-800">{monthLabel(month)}</span>
          <button onClick={() => setMonth(nextMonth(month))} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Summary Row */}
        <div className="max-w-2xl mx-auto px-4 pb-3 grid grid-cols-3 gap-2">
          <div className="bg-green-50 rounded-xl p-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-green-600"><TrendingUp size={13} /><span className="text-xs font-medium">Income</span></div>
            <span className="text-sm font-bold text-green-700">{formatCurrency(income, symbol)}</span>
          </div>
          <div className="bg-red-50 rounded-xl p-3 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-red-500"><TrendingDown size={13} /><span className="text-xs font-medium">Expenses</span></div>
            <span className="text-sm font-bold text-red-600">{formatCurrency(expense, symbol)}</span>
          </div>
          <div className={`rounded-xl p-3 flex flex-col gap-0.5 ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <div className={`flex items-center gap-1 ${balance >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
              <Minus size={13} /><span className="text-xs font-medium">Balance</span>
            </div>
            <span className={`text-sm font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{formatCurrency(balance, symbol)}</span>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        {sortedDates.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm">No transactions for {monthLabel(month)}</p>
            <p className="text-xs mt-1">Tap <strong className="text-cocoa-accent">+</strong> to add one</p>
          </div>
        )}

        {sortedDates.map((date) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{formatGroupDate(date)}</span>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">
                {formatCurrency(
                  grouped[date].reduce((sum, tx) => tx.type === 'expense' ? sum - tx.amount : tx.type === 'income' ? sum + tx.amount : sum, 0),
                  symbol
                )}
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
              {grouped[date].map((tx) => {
                const cat     = SYSTEM_CATEGORIES.find((c) => c.id === tx.categoryId);
                const emoji   = cat ? catEmoji(cat.icon) : '•';
                const isInc   = tx.type === 'income';
                const isExp   = tx.type === 'expense';

                return (
                  <button
                    key={tx.id}
                    onClick={() => setEditingTx(tx)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: cat?.bgColor ?? '#F0F0F0' }}>
                      {emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{tx.payee || cat?.name || 'Transaction'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {tx.note && <span className="text-xs text-gray-400 truncate max-w-[140px]">{tx.note}</span>}
                        {tx.note && <span className="text-gray-300 text-xs">·</span>}
                        <span className="text-xs text-gray-400">{formatTime(tx.time)}</span>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold flex-shrink-0 ${isInc ? 'text-green-600' : isExp ? 'text-red-500' : 'text-gray-600'}`}>
                      {isInc ? '+' : isExp ? '-' : ''}{formatCurrency(tx.amount, symbol)}
                    </span>
                    <Pencil size={13} className="text-gray-300 group-hover:text-cocoa-accent flex-shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
