import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page Imports
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetails from './pages/LeadDetails';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Vendors from './pages/Vendors';
import Operations from './pages/Operations';
import Expenses from './pages/Expenses';
import ExpensesHistory from './pages/ExpensesHistory';
import Reports from './pages/Reports';
import DeleteRequests from './pages/DeleteRequests';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Payouts from './pages/Payouts';

// Protected Route Guard
const ProtectedLayout = ({ allowedPermission = null }) => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedPermission && !hasPermission(allowedPermission)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-brand-950 font-sans">
      {/* Navigation Drawer */}
      <Sidebar />

      {/* Main Panel Content Area */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col transition-all duration-300">
        <Navbar title={window.location.pathname === '/' ? 'Dashboard' : ''} />
        <div className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            
            {/* Lead Routes */}
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetails />} />
            
            {/* Bookings */}
            <Route path="/bookings" element={<Bookings />} />
            
            {/* Operations */}
            <Route path="/operations" element={<Operations />} />
            
            {/* Payouts */}
            <Route path="/payouts" element={<Payouts />} />

            {/* Admin/Finance - Payments */}
            <Route path="/payments" element={<Payments />} />
            
            {/* Admin/Finance - Expenses */}
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/expenses/history" element={<ExpensesHistory />} />
            
            {/* Admin/Marketing - Reports */}
            <Route path="/reports" element={<Reports />} />
            
            {/* Admin - Vendor management */}
            <Route path="/vendors" element={<Vendors />} />
            
            {/* Admin - Deletion Tickets */}
            <Route path="/delete-requests" element={<DeleteRequests />} />
            
            {/* Admin - Staff user management */}
            <Route path="/users" element={<Users />} />
            
            {/* Admin - General settings configuration */}
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
