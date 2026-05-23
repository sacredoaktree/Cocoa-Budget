import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Home from './pages/Home';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Settings from './pages/Settings';
import Goals from './pages/Goals';
import NetWorth from './pages/NetWorth';
import BillSplit from './pages/BillSplit';
import DebtPlanner from './pages/DebtPlanner';
import SubscriptionAudit from './pages/SubscriptionAudit';
import Analytics from './pages/Analytics';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/net-worth" element={<NetWorth />} />
          <Route path="/bill-split" element={<BillSplit />} />
          <Route path="/debt-planner" element={<DebtPlanner />} />
          <Route path="/subscription-audit" element={<SubscriptionAudit />} />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
