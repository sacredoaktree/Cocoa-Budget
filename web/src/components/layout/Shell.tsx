import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  Home,
  Wallet,
  Receipt,
  PieChart,
  Settings,
  Eye,
  EyeOff,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import { useSettingsStore } from '@shared/store/useSettingsStore';
import QuickAdd from '../QuickAdd';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/',                      label: 'Home',      icon: <Home size={20} /> },
  { to: '/accounts',              label: 'Accounts',  icon: <Wallet size={20} /> },
  { to: '/transactions',          label: 'Txns',      icon: <Receipt size={20} /> },
  { to: '/budget',                label: 'Budget',    icon: <PieChart size={20} /> },
  { to: '/subscription-audit',    label: 'Recurring', icon: <RefreshCw size={20} /> },
  { to: '/analytics',             label: 'Analytics', icon: <BarChart2 size={20} /> },
  { to: '/settings',              label: 'Settings',  icon: <Settings size={20} /> },
];

export default function Shell() {
  const { settings, togglePrivacyMode } = useSettingsStore();
  const { privacyMode } = settings;

  return (
    <div className="flex h-screen overflow-hidden bg-cocoa-bg">
      {/* ── Sidebar (desktop ≥768px) ───────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-60 flex-shrink-0 h-full"
        style={{ backgroundColor: '#3D2B1F' }}
      >
        {/* Logo */}
        <div className="px-5 py-6">
          <span className="text-lg font-bold text-white tracking-tight">
            🍫 Cocoa Budget
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: '#C8956A' } : {}
              }
            >
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Privacy toggle */}
        <div className="px-3 pb-6">
          <button
            onClick={togglePrivacyMode}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
            <span>{privacyMode ? 'Privacy On' : 'Privacy Off'}</span>
          </button>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

        {/* Top bar (mobile <768px) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-cocoa-divider">
          <span className="text-base font-bold text-cocoa-primary">
            🍫 Cocoa Budget
          </span>
          <button
            onClick={togglePrivacyMode}
            className="p-2 rounded-full text-cocoa-text2 hover:bg-cocoa-bg transition-colors"
            aria-label={privacyMode ? 'Disable privacy mode' : 'Enable privacy mode'}
          >
            {privacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-28 md:pb-0">
          <Outlet />
        </main>

        {/* Quick-add FAB (always visible) */}
        <QuickAdd />

        {/* Bottom tab bar (mobile <768px) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-cocoa-divider z-50">
          <div className="flex">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-cocoa-accent'
                      : 'text-cocoa-text3 hover:text-cocoa-text2'
                  }`
                }
              >
                {icon}
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
