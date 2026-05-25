import React, { useState } from 'react';
import { Plus, X, Pencil, Archive, ArrowLeftRight } from 'lucide-react';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useTransactionStore } from '@shared/store/useTransactionStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { Account, AccountType } from '@shared/types';
import { CURRENCY_SYMBOLS, symbolForCurrency, formatCurrency } from '@shared/utils/currency';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';

const TYPE_LABELS: Record<AccountType, string> = {
  checking:   'Checking',
  savings:    'Savings',
  cash:       'Cash',
  digital:    'Digital / E-wallet',
  investment: 'Investment',
  stock:      'Stock',
  crypto:     'Crypto',
  credit:     'Credit Card',
  loan:       'Loan',
};

const ACCOUNT_COLORS = [
  '#2E9E6B', '#4A7FD4', '#C8956A', '#D94F3D',
  '#E88C2A', '#D4AF37', '#8B5CF6', '#EC4899',
  '#253B80', '#48C774', '#3D2B1F', '#4A90D9',
];

const ASSET_TYPES: AccountType[]     = ['checking', 'savings', 'cash', 'digital', 'investment', 'stock', 'crypto'];
const LIABILITY_TYPES: AccountType[] = ['credit', 'loan'];

// ── Transfer Modal ────────────────────────────────────────────────────────────
function TransferModal({ onClose }: { onClose: () => void }) {
  const accounts    = useAccountStore((s) => s.accounts.filter((a) => !a.isArchived));
  const transfer    = useAccountStore((s) => s.transfer);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const { settings } = useSettingsStore();
  const symbol = symbolForCurrency(settings.currency);

  const [fromId, setFromId]     = useState(accounts[0]?.id ?? '');
  const [toId, setToId]         = useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [amountRaw, setAmountRaw] = useState('');
  const [feeRaw, setFeeRaw]     = useState('');
  const [note, setNote]         = useState('');
  const [date, setDate]         = useState(new Date().toISOString().slice(0, 10));
  const [error, setError]       = useState('');

  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount   = accounts.find((a) => a.id === toId);
  const amountCents = Math.round(parseFloat(amountRaw || '0') * 100);
  const feeCents    = Math.round(parseFloat(feeRaw || '0') * 100);
  const totalDebit  = amountCents + feeCents;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId)    { setError('Select both accounts'); return; }
    if (fromId === toId)     { setError('Cannot transfer to the same account'); return; }
    if (amountCents <= 0)    { setError('Enter a valid amount'); return; }

    const now   = new Date();
    const time  = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const pairId = `pair-${Date.now()}`;
    const txNote = note.trim() || `Transfer to ${toAccount?.name ?? ''}`;

    addTransaction({
      id: `tx-${Date.now()}-out`,
      type: 'transfer',
      amount: totalDebit,
      accountId: fromId,
      categoryId: 'cat-transfer',
      transferToAccountId: toId,
      transferPairId: pairId,
      payee: toAccount?.name ?? 'Transfer',
      note: txNote,
      date,
      time,
      isDeleted: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    addTransaction({
      id: `tx-${Date.now() + 1}-in`,
      type: 'transfer',
      amount: amountCents,
      accountId: toId,
      categoryId: 'cat-transfer',
      transferToAccountId: fromId,
      transferPairId: pairId,
      payee: fromAccount?.name ?? 'Transfer',
      note: `Transfer from ${fromAccount?.name ?? ''}${note.trim() ? ` · ${note.trim()}` : ''}`,
      date,
      time,
      isDeleted: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    transfer(fromId, toId, amountCents, feeCents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #4A7FD4 0%, #7BA7E8 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ArrowLeftRight size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Transfer Money</h2>
              <p className="text-xs text-white/70">Move funds between accounts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* From → To */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">From</label>
              <select value={fromId} onChange={(e) => setFromId(e.target.value)}
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="pb-2.5 text-cocoa-text3 font-bold text-lg">→</div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">To</label>
              <select value={toId} onChange={(e) => setToId(e.target.value)}
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                {accounts.filter((a) => a.id !== fromId).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm font-medium">{symbol}</span>
              <input type="number" value={amountRaw} onChange={(e) => setAmountRaw(e.target.value)}
                placeholder="0.00" min="0" step="0.01"
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            {fromAccount && amountCents > 0 && (
              <p className="text-xs text-cocoa-text3 mt-1">
                {fromAccount.name} balance after: {formatCurrency(fromAccount.balance - totalDebit, symbol)}
              </p>
            )}
          </div>

          {/* Transfer Fee */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">
              Transfer Fee <span className="normal-case font-normal text-cocoa-text3">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm font-medium">{symbol}</span>
              <input type="number" value={feeRaw} onChange={(e) => setFeeRaw(e.target.value)}
                placeholder="0.00" min="0" step="0.01"
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            {feeCents > 0 && amountCents > 0 && (
              <p className="text-xs text-cocoa-text3 mt-1">
                Total deducted from {fromAccount?.name}: {formatCurrency(totalDebit, symbol)}
                {' '}({formatCurrency(amountCents, symbol)} + {formatCurrency(feeCents, symbol)} fee)
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1.5 uppercase tracking-wide">
              Note <span className="normal-case font-normal text-cocoa-text3">(optional)</span>
            </label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Monthly savings transfer"
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>

          {error && <p className="text-xs text-cocoa-expense font-semibold">{error}</p>}

          <button type="submit"
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-colors"
            style={{ background: 'linear-gradient(135deg, #4A7FD4 0%, #7BA7E8 100%)' }}>
            Transfer {amountCents > 0 ? formatCurrency(amountCents, symbol) : ''}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Add Account Modal ─────────────────────────────────────────────────────────
function AddAccountModal({ onClose, defaultCurrency }: { onClose: () => void; defaultCurrency: string }) {
  const { addAccount } = useAccountStore();

  const [name, setName]           = useState('');
  const [type, setType]           = useState<AccountType>('savings');
  const [currency, setCurrency]   = useState(defaultCurrency);
  const [balanceRaw, setBalanceRaw] = useState('');
  const [note, setNote]           = useState('');
  const [color, setColor]         = useState(ACCOUNT_COLORS[0]);
  const [creditLimitRaw, setCreditLimitRaw] = useState('');
  const [interestRateRaw, setInterestRateRaw] = useState('');
  const [error, setError]         = useState('');

  const isLiability = LIABILITY_TYPES.includes(type);
  const symbol = symbolForCurrency(currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Account name is required'); return; }
    const balance = parseFloat(balanceRaw);
    if (isNaN(balance)) { setError('Enter a valid balance'); return; }

    const account: Account = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      type,
      color,
      icon: 'card-outline',
      currency,
      balance: isLiability
        ? -Math.abs(Math.round(balance * 100))
        : Math.round(balance * 100),
      note: note.trim(),
      countInAsset: !isLiability,
      hideBalance: false,
      chartColor: color,
      isArchived: false,
      displayOrder: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(isLiability && creditLimitRaw
        ? { creditLimit: Math.round(parseFloat(creditLimitRaw) * 100) }
        : {}),
      ...(isLiability && interestRateRaw
        ? { interestRate: parseFloat(interestRateRaw) }
        : {}),
    };
    addAccount(account);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-cocoa-divider flex items-center justify-between">
          <h2 className="text-lg font-bold text-cocoa-text1">Add Account</h2>
          <button onClick={onClose} className="p-1 text-cocoa-text3 hover:text-cocoa-text1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Account Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BPI Savings, IBKR, Wise USD"
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
            >
              {(Object.keys(TYPE_LABELS) as AccountType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
            >
              {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                <option key={code} value={code}>{sym} {code}</option>
              ))}
            </select>
            <p className="text-xs text-cocoa-text3 mt-1">
              Each account can have its own currency (e.g. USD for IBKR, PHP for BPI)
            </p>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">
              {isLiability ? 'Current Balance Owed' : 'Current Balance'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm font-medium">{symbol}</span>
              <input
                type="number"
                value={balanceRaw}
                onChange={(e) => setBalanceRaw(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
              />
            </div>
          </div>

          {/* Credit card extras */}
          {isLiability && (
            <>
              <div>
                <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Credit Limit (optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm">{symbol}</span>
                  <input
                    type="number"
                    value={creditLimitRaw}
                    onChange={(e) => setCreditLimitRaw(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Interest Rate % (optional)</label>
                <input
                  type="number"
                  value={interestRateRaw}
                  onChange={(e) => setInterestRateRaw(e.target.value)}
                  placeholder="e.g. 24"
                  min="0"
                  step="0.01"
                  className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
                />
              </div>
            </>
          )}

          {/* Last 4 digits / note */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. last 4 digits, account memo"
              maxLength={20}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-2 uppercase tracking-wide">Color</label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-cocoa-accent' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-cocoa-expense font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            Add Account
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Edit Account Modal ────────────────────────────────────────────────────────
function EditAccountModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const { updateAccount, archiveAccount } = useAccountStore();
  const symbol = symbolForCurrency(account.currency);
  const isLiability = LIABILITY_TYPES.includes(account.type);

  const [name, setName]         = useState(account.name);
  const [balanceRaw, setBalanceRaw] = useState((Math.abs(account.balance) / 100).toFixed(2));
  const [note, setNote]         = useState(account.note);
  const [currency, setCurrency] = useState(account.currency);
  const [creditLimitRaw, setCreditLimitRaw] = useState(
    account.creditLimit ? (account.creditLimit / 100).toFixed(2) : ''
  );
  const [interestRateRaw, setInterestRateRaw] = useState(
    account.interestRate ? String(account.interestRate) : ''
  );
  const [error, setError] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    const bal = parseFloat(balanceRaw);
    if (isNaN(bal) || bal < 0) { setError('Enter a valid balance'); return; }
    const updates: Partial<Account> = {
      name: name.trim(),
      note: note.trim(),
      currency,
      balance: isLiability ? -Math.round(bal * 100) : Math.round(bal * 100),
    };
    if (isLiability && creditLimitRaw) updates.creditLimit = Math.round(parseFloat(creditLimitRaw) * 100);
    if (isLiability && interestRateRaw) updates.interestRate = parseFloat(interestRateRaw);
    updateAccount(account.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-cocoa-divider flex items-center justify-between">
          <h2 className="text-lg font-bold text-cocoa-text1">Edit Account</h2>
          <button onClick={onClose} className="p-1 text-cocoa-text3 hover:text-cocoa-text1"><X size={20} /></button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Account Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent">
              {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                <option key={code} value={code}>{sym} {code}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">
              {isLiability ? 'Balance Owed' : 'Current Balance'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm font-medium">
                {symbolForCurrency(currency)}
              </span>
              <input type="number" value={balanceRaw} onChange={(e) => setBalanceRaw(e.target.value)}
                min="0" step="0.01"
                className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
            </div>
          </div>

          {isLiability && (
            <>
              <div>
                <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Credit Limit (optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa-text2 text-sm">{symbol}</span>
                  <input type="number" value={creditLimitRaw} onChange={(e) => setCreditLimitRaw(e.target.value)}
                    min="0" step="0.01"
                    className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Interest Rate %</label>
                <input type="number" value={interestRateRaw} onChange={(e) => setInterestRateRaw(e.target.value)}
                  min="0" step="0.01"
                  className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-cocoa-text2 mb-1 uppercase tracking-wide">Note</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="last 4 digits or memo" maxLength={20}
              className="w-full bg-cocoa-input border border-cocoa-divider rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cocoa-accent" />
          </div>

          {error && <p className="text-xs text-cocoa-expense font-medium">{error}</p>}

          <button type="submit"
            className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-cocoa-accent hover:opacity-90">
            Save Changes
          </button>

          <button type="button" onClick={() => { archiveAccount(account.id); onClose(); }}
            className="w-full py-2.5 rounded-xl text-cocoa-expense text-sm font-medium border border-cocoa-expense/30 hover:bg-cocoa-expense/5 flex items-center justify-center gap-2">
            <Archive size={14} />
            Archive Account
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Account Row ───────────────────────────────────────────────────────────────
function AccountRow({ account, onEdit }: { account: Account; onEdit: (a: Account) => void }) {
  const isNegative = account.balance < 0;
  const symbol = symbolForCurrency(account.currency);

  return (
    <div className="flex items-center gap-3 py-3 group">
      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: account.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cocoa-text1 truncate">{account.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {account.note && <p className="text-xs text-cocoa-text3">•••• {account.note}</p>}
          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: account.color + '22', color: account.color }}>
            {account.currency}
          </span>
        </div>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
        style={{ backgroundColor: account.color + '22', color: account.color }}>
        {TYPE_LABELS[account.type]}
      </span>
      <AmountText cents={Math.abs(account.balance)} symbol={symbol}
        className={`text-sm font-semibold flex-shrink-0 ${isNegative ? 'text-cocoa-expense' : 'text-cocoa-income'}`} />
      <button onClick={() => onEdit(account)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-cocoa-text3 hover:text-cocoa-accent hover:bg-cocoa-input transition-all flex-shrink-0"
        title="Edit account">
        <Pencil size={14} />
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Accounts() {
  const accounts            = useAccountStore((s) => s.accounts);
  const getTotalAssets      = useAccountStore((s) => s.getTotalAssets);
  const getTotalLiabilities = useAccountStore((s) => s.getTotalLiabilities);
  const getNetWorth         = useAccountStore((s) => s.getNetWorth);
  const { settings }        = useSettingsStore();
  const symbol              = symbolForCurrency(settings.currency);

  const [showModal, setShowModal]         = useState(false);
  const [showTransfer, setShowTransfer]   = useState(false);
  const [editAccount, setEditAccount]     = useState<Account | null>(null);

  const totalAssets      = getTotalAssets();
  const totalLiabilities = getTotalLiabilities();
  const netWorth         = getNetWorth();

  const active     = accounts.filter((a) => !a.isArchived);
  const assetAccts = active.filter((a) => ASSET_TYPES.includes(a.type) && a.countInAsset);
  const liabAccts  = active.filter((a) => LIABILITY_TYPES.includes(a.type));

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cocoa-text1">Accounts</h1>
        <div className="flex items-center gap-2">
          {active.length >= 2 && (
            <button
              onClick={() => setShowTransfer(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-cocoa-divider text-cocoa-text2 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <ArrowLeftRight size={15} />
              Transfer
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold bg-cocoa-accent hover:opacity-90"
          >
            <Plus size={16} />
            Add Account
          </button>
        </div>
      </div>

      {/* Net Worth hero */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #7C5CBF 0%, #9B7DD4 100%)' }}
      >
        <p className="text-white/70 text-sm mb-1">Net Worth</p>
        <AmountText cents={netWorth} symbol={symbol} className="text-3xl font-bold text-white" />
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Assets</p>
            <AmountText cents={totalAssets} symbol={symbol} className="text-base font-semibold text-white" />
          </div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Liabilities</p>
            <AmountText cents={totalLiabilities} symbol={symbol} className="text-base font-semibold text-white/80" />
          </div>
        </div>
        {active.length === 0 && (
          <p className="text-white/50 text-xs mt-3">Add your first account to get started</p>
        )}
      </div>

      {/* Assets */}
      <Card>
        <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-2">Assets</h2>
        <div className="divide-y divide-cocoa-divider">
          {assetAccts.length === 0
            ? <p className="text-sm text-cocoa-text3 py-4 text-center">No asset accounts yet</p>
            : assetAccts.map((a) => <AccountRow key={a.id} account={a} onEdit={setEditAccount} />)
          }
        </div>
        {assetAccts.length > 0 && (
          <div className="flex justify-between items-center pt-3 mt-2 border-t border-cocoa-divider">
            <span className="text-xs text-cocoa-text3 font-medium uppercase tracking-wide">Total Assets</span>
            <AmountText cents={totalAssets} symbol={symbol} className="text-sm font-bold text-cocoa-income" />
          </div>
        )}
      </Card>

      {/* Liabilities */}
      <Card>
        <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-2">Liabilities</h2>
        <div className="divide-y divide-cocoa-divider">
          {liabAccts.length === 0
            ? <p className="text-sm text-cocoa-text3 py-4 text-center">No liability accounts yet</p>
            : liabAccts.map((a) => <AccountRow key={a.id} account={a} onEdit={setEditAccount} />)
          }
        </div>
        {liabAccts.length > 0 && (
          <div className="flex justify-between items-center pt-3 mt-2 border-t border-cocoa-divider">
            <span className="text-xs text-cocoa-text3 font-medium uppercase tracking-wide">Total Liabilities</span>
            <AmountText cents={totalLiabilities} symbol={symbol} className="text-sm font-bold text-cocoa-expense" />
          </div>
        )}
      </Card>

      {showModal && (
        <AddAccountModal onClose={() => setShowModal(false)} defaultCurrency={settings.currency} />
      )}
      {editAccount && (
        <EditAccountModal account={editAccount} onClose={() => setEditAccount(null)} />
      )}
      {showTransfer && (
        <TransferModal onClose={() => setShowTransfer(false)} />
      )}
    </div>
  );
}
