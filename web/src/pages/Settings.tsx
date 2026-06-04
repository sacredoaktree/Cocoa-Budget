import { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Eye,
  EyeOff,
  Check,
  Pencil,
} from 'lucide-react';
import { useSettingsStore } from '@shared/store/useSettingsStore';

// ─── Currency data ────────────────────────────────────────────────────────────
const CURRENCIES: { code: string; symbol: string; name: string }[] = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
];

// ─── Language data ────────────────────────────────────────────────────────────
const LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'fil', name: 'Filipino' },
  { code: 'es', name: 'Spanish' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
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
    return (
      <button className="w-full text-left" onClick={onClick}>
        {inner}
      </button>
    );
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

// ─── Currency Picker ─────────────────────────────────────────────────────────
function CurrencyPicker({
  currentCode,
  onSelect,
}: {
  currentCode: string;
  onSelect: (code: string, symbol: string) => void;
}) {
  return (
    <div className="border-t border-gray-100 bg-gray-50 max-h-64 overflow-y-auto">
      {CURRENCIES.map((c) => (
        <button
          key={c.code}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors text-left"
          onClick={() => onSelect(c.code, c.symbol)}
        >
          <span className="w-8 text-center text-sm font-mono text-gray-500">{c.symbol}</span>
          <span className="flex-1 text-sm text-gray-800">
            {c.code} — {c.name}
          </span>
          {c.code === currentCode && <Check size={14} className="text-[#C8956A]" />}
        </button>
      ))}
    </div>
  );
}

// ─── Language Picker ─────────────────────────────────────────────────────────
function LanguagePicker({
  currentCode,
}: {
  currentCode: string;
}) {
  return (
    <div className="border-t border-gray-100 bg-gray-50 max-h-64 overflow-y-auto">
      {LANGUAGES.map((l) => (
        <div
          key={l.code}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 transition-colors"
        >
          <span className="flex-1 text-sm text-gray-800">{l.name}</span>
          {l.code === currentCode && <Check size={14} className="text-[#C8956A]" />}
          {l.code !== 'en' && (
            <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
              Soon
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Settings page ───────────────────────────────────────────────────────
export default function Settings() {
  const { settings, updateSettings } = useSettingsStore();

  // Toggle state
  const [darkMode, setDarkMode] = useState(settings.theme === 'dark');
  const [privacyMode, setPrivacyMode] = useState(settings.privacyMode);
  const [lockEnabled, setLockEnabled] = useState(settings.lockEnabled);

  // Picker open state
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  // Display name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(settings.displayName || '');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const saveName = () => {
    const trimmed = nameValue.trim();
    if (trimmed) {
      updateSettings({ displayName: trimmed });
    } else {
      setNameValue(settings.displayName || '');
    }
    setEditingName(false);
  };

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

        {/* ── Profile Card ─────────────────────────────────────────────── */}
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
              {editingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName();
                      if (e.key === 'Escape') {
                        setNameValue(settings.displayName || '');
                        setEditingName(false);
                      }
                    }}
                    className="text-base font-bold text-gray-900 border-b border-[#C8956A] bg-transparent outline-none w-full"
                  />
                </div>
              ) : (
                <button
                  className="flex items-center gap-1.5 group mb-0.5"
                  onClick={() => setEditingName(true)}
                >
                  <p className="text-base font-bold text-gray-900 truncate">
                    {settings.displayName || 'Cocoa User'}
                  </p>
                  <Pencil
                    size={12}
                    className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0"
                  />
                </button>
              )}
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

        {/* ── Finance Section ───────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Finance" />
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            <SettingsRow icon={<Target size={16} />} label="Savings Goals" to="/goals" />
            <SettingsRow
              icon={<TrendingUp size={16} />}
              label="Net Worth Timeline"
              to="/net-worth"
            />
            <SettingsRow icon={<Users size={16} />} label="Bill Splitting" to="/bill-split" />
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

        {/* ── Preferences Section ───────────────────────────────────────── */}
        <div>
          <SectionHeader title="Preferences" />
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">

            {/* Currency picker row + panel */}
            <div>
              <button
                className="w-full text-left"
                onClick={() => {
                  setCurrencyOpen((o) => !o);
                  if (languageOpen) setLanguageOpen(false);
                }}
              >
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <Globe size={16} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800">Base Currency</span>
                  <span className="text-sm text-gray-400">{settings.currency}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-300 transition-transform ${currencyOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>
              {currencyOpen && (
                <CurrencyPicker
                  currentCode={settings.currency}
                  onSelect={(code, symbol) => {
                    updateSettings({ currency: code, currencySymbol: symbol });
                    setCurrencyOpen(false);
                  }}
                />
              )}
            </div>

            {/* Dark Mode toggle */}
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

            {/* Privacy Mode toggle */}
            <SettingsRow
              icon={privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
              label="Privacy Mode"
              right={
                <Toggle
                  enabled={privacyMode}
                  onChange={(val) => {
                    setPrivacyMode(val);
                    updateSettings({ privacyMode: val });
                  }}
                />
              }
            />

            {/* Language picker row + panel */}
            <div>
              <button
                className="w-full text-left"
                onClick={() => {
                  setLanguageOpen((o) => !o);
                  if (currencyOpen) setCurrencyOpen(false);
                }}
              >
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0">
                    <Globe size={16} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800">Language</span>
                  <span className="text-sm text-gray-400">English</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-300 transition-transform ${languageOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>
              {languageOpen && <LanguagePicker currentCode="en" />}
            </div>
          </div>
        </div>

        {/* ── Data Section ──────────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Data" />
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
            <SettingsRow icon={<Download size={16} />} label="Export Data" to="/settings/export" />
            <SettingsRow icon={<Upload size={16} />} label="Import Data" to="/settings/import" />
            <SettingsRow icon={<HardDrive size={16} />} label="Backups" to="/settings/backups" />
          </div>
        </div>

        {/* ── Security Section ──────────────────────────────────────────── */}
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
