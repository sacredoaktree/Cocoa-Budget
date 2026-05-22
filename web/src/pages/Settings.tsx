import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  Users,
  CreditCard,
  Search,
  Globe,
  Moon,
  Download,
  Upload,
  HardDrive,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { useSettingsStore } from '@shared/store/useSettingsStore';

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 px-1 mb-1">
      {title}
    </h2>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  to,
  onClick,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  to?: string;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
      {value && <span className="text-sm text-gray-400">{value}</span>}
      {right ?? <ChevronRight size={16} className="text-gray-300" />}
    </div>
  );

  if (to) {
    return <Link to={to}>{inner}</Link>;
  }
  if (onClick) {
    return <button className="w-full text-left" onClick={onClick}>{inner}</button>;
  }
  return <div>{inner}</div>;
}

function Toggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled ? 'bg-[#C8956A]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function Settings() {
  const { settings, updateSettings } = useSettingsStore();
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');
  const [lockEnabled, setLockEnabled] = useState(settings.lockEnabled);

  const initials = settings.displayName
    ? settings.displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'CB';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ backgroundColor: '#C8956A' }}
            >
              {initials}
            </div>

            {/* Name + Stats */}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900 truncate">
                {settings.displayName || 'Cocoa User'}
              </p>
              <p className="text-xs text-gray-400 mb-2">{settings.currency}</p>

              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">{settings.streakDays}</p>
                  <p className="text-[10px] text-gray-400">Streak</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">{settings.totalDaysUsed}</p>
                  <p className="text-[10px] text-gray-400">Days</p>
                </div>
                <div className="w-px bg-gray-100" />
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">
                    {settings.totalTransactionCount}
                  </p>
                  <p className="text-[10px] text-gray-400">Transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Finance Section */}
        <div>
          <SectionHeader title="Finance" />
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            <SettingsRow
              icon={<Target size={16} />}
              label="Savings Goals"
              to="/goals"
            />
            <SettingsRow
              icon={<TrendingUp size={16} />}
              label="Net Worth Timeline"
              to="/net-worth"
            />
            <SettingsRow
              icon={<Users size={16} />}
              label="Bill Splitting"
              to="/bill-split"
            />
            <SettingsRow
              icon={<CreditCard size={16} />}
              label="Debt Planner"
              to="/debt-planner"
            />
            <SettingsRow
              icon={<Search size={16} />}
              label="Subscription Audit"
              to="/subscriptions"
            />
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <SectionHeader title="Preferences" />
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            <SettingsRow
              icon={<Globe size={16} />}
              label="Base Currency"
              value={settings.currency}
              to="/settings/currency"
            />
            <SettingsRow
              icon={<Moon size={16} />}
              label="Dark Mode"
              right={
                <Toggle
                  enabled={darkMode}
                  onChange={(val) => {
                    setDarkMode(val);
                    updateSettings({ theme: val ? 'dark' : 'light' });
                  }}
                />
              }
            />
            <SettingsRow
              icon={<Globe size={16} />}
              label="Language"
              value="English"
              to="/settings/language"
            />
          </div>
        </div>

        {/* Data Section */}
        <div>
          <SectionHeader title="Data" />
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            <SettingsRow
              icon={<Download size={16} />}
              label="Export Data"
              to="/settings/export"
            />
            <SettingsRow
              icon={<Upload size={16} />}
              label="Import Data"
              to="/settings/import"
            />
            <SettingsRow
              icon={<HardDrive size={16} />}
              label="Backups"
              to="/settings/backups"
            />
          </div>
        </div>

        {/* Security Section */}
        <div>
          <SectionHeader title="Security" />
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <SettingsRow
              icon={<Lock size={16} />}
              label="App Lock"
              right={
                <Toggle
                  enabled={lockEnabled}
                  onChange={(val) => {
                    setLockEnabled(val);
                    updateSettings({ lockEnabled: val });
                  }}
                />
              }
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 pb-4">Cocoa Budget v1.0.0</p>
      </div>
    </div>
  );
}
