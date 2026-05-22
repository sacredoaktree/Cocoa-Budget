import React from 'react';
import { useAccountStore } from '@shared/store/useAccountStore';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import { Account, AccountType } from '@shared/types';
import AmountText from '../components/ui/AmountText';
import Card from '../components/ui/Card';

const TYPE_LABELS: Record<AccountType, string> = {
  checking:   'Checking',
  savings:    'Savings',
  cash:       'Cash',
  digital:    'Digital',
  investment: 'Investment',
  stock:      'Stock',
  crypto:     'Crypto',
  credit:     'Credit Card',
  loan:       'Loan',
};

const ASSET_TYPES: AccountType[]     = ['checking', 'savings', 'cash', 'digital', 'investment'];
const LIABILITY_TYPES: AccountType[] = ['credit', 'loan'];

interface AccountRowProps {
  account: Account;
  currencySymbol: string;
}

function AccountRow({ account, currencySymbol }: AccountRowProps) {
  const isNegative = account.balance < 0;
  return (
    <div className="flex items-center gap-3 py-3">
      {/* Colored left border indicator */}
      <div
        className="w-1 self-stretch rounded-full flex-shrink-0"
        style={{ backgroundColor: account.color }}
      />

      {/* Name + note */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cocoa-text1 truncate">{account.name}</p>
        {account.note ? (
          <p className="text-xs text-cocoa-text3">•••• {account.note}</p>
        ) : null}
      </div>

      {/* Type badge */}
      <span
        className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
        style={{
          backgroundColor: account.color + '22',
          color: account.color,
        }}
      >
        {TYPE_LABELS[account.type]}
      </span>

      {/* Balance */}
      <AmountText
        cents={Math.abs(account.balance)}
        symbol={currencySymbol}
        className={`text-sm font-semibold flex-shrink-0 ${
          isNegative ? 'text-cocoa-expense' : 'text-cocoa-income'
        }`}
      />
    </div>
  );
}

export default function Accounts() {
  const accounts = useAccountStore((s) => s.accounts);
  const getTotalAssets      = useAccountStore((s) => s.getTotalAssets);
  const getTotalLiabilities = useAccountStore((s) => s.getTotalLiabilities);
  const getNetWorth         = useAccountStore((s) => s.getNetWorth);
  const { settings }        = useSettingsStore();
  const { currencySymbol }  = settings;

  const totalAssets      = getTotalAssets();
  const totalLiabilities = getTotalLiabilities();
  const netWorth         = getNetWorth();

  const active     = accounts.filter((a) => !a.isArchived);
  const assetAccts = active.filter((a) => ASSET_TYPES.includes(a.type) && a.countInAsset);
  const liabAccts  = active.filter((a) => LIABILITY_TYPES.includes(a.type));

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6">

      {/* Net Worth hero */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #7C5CBF 0%, #9B7DD4 100%)' }}
      >
        <p className="text-white/70 text-sm mb-1">Net Worth</p>
        <AmountText
          cents={netWorth}
          symbol={currencySymbol}
          className="text-3xl font-bold text-white"
        />
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Assets</p>
            <AmountText
              cents={totalAssets}
              symbol={currencySymbol}
              className="text-base font-semibold text-white"
            />
          </div>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide">Liabilities</p>
            <AmountText
              cents={totalLiabilities}
              symbol={currencySymbol}
              className="text-base font-semibold text-white/80"
            />
          </div>
        </div>
      </div>

      {/* Assets group */}
      <Card>
        <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-2">
          Assets
        </h2>
        <div className="divide-y divide-cocoa-divider">
          {assetAccts.length === 0 && (
            <p className="text-sm text-cocoa-text3 py-3">No asset accounts.</p>
          )}
          {assetAccts.map((a) => (
            <AccountRow key={a.id} account={a} currencySymbol={currencySymbol} />
          ))}
        </div>
        {assetAccts.length > 0 && (
          <div className="flex justify-between items-center pt-3 mt-2 border-t border-cocoa-divider">
            <span className="text-xs text-cocoa-text3 font-medium uppercase tracking-wide">Total Assets</span>
            <AmountText
              cents={totalAssets}
              symbol={currencySymbol}
              className="text-sm font-bold text-cocoa-income"
            />
          </div>
        )}
      </Card>

      {/* Liabilities group */}
      <Card>
        <h2 className="text-xs font-semibold text-cocoa-text3 uppercase tracking-wide mb-2">
          Liabilities
        </h2>
        <div className="divide-y divide-cocoa-divider">
          {liabAccts.length === 0 && (
            <p className="text-sm text-cocoa-text3 py-3">No liability accounts.</p>
          )}
          {liabAccts.map((a) => (
            <AccountRow key={a.id} account={a} currencySymbol={currencySymbol} />
          ))}
        </div>
        {liabAccts.length > 0 && (
          <div className="flex justify-between items-center pt-3 mt-2 border-t border-cocoa-divider">
            <span className="text-xs text-cocoa-text3 font-medium uppercase tracking-wide">Total Liabilities</span>
            <AmountText
              cents={totalLiabilities}
              symbol={currencySymbol}
              className="text-sm font-bold text-cocoa-expense"
            />
          </div>
        )}
      </Card>
    </div>
  );
}
