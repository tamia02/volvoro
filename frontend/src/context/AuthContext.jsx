import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

const permissionsMap = {
  create_user: ['admin'],
  deactivate_user: ['admin'],
  create_lead: ['admin'],
  view_lead_all: ['admin'],
  view_lead_own: ['admin', 'sales_exec'],
  edit_lead: ['admin', 'sales_exec'],
  edit_customer_number: ['admin'],
  delete_lead: ['admin'],
  assign_lead: ['admin'],
  update_lead_status: ['admin', 'sales_exec'],
  view_lead_source_reports: ['admin', 'marketing'],
  create_quotation: ['admin', 'sales_exec'],
  view_vendor_cost: ['admin'],
  raise_booking: ['admin', 'sales_exec'],
  approve_booking: ['admin'],
  upload_payment: ['admin', 'sales_exec'],
  verify_payment: ['admin', 'finance'],
  view_revenue_profit: ['admin'],
  manage_vendors: ['admin'],
  view_operations: ['admin', 'operations'],
  update_operations: ['admin', 'operations'],
  view_expenses: ['admin', 'finance'],
  add_expense: ['admin', 'finance'],
  approve_commission: ['admin'],
  view_activity_logs: ['admin'],
  raise_delete_request: ['admin', 'sales_exec', 'finance', 'operations', 'marketing'],
  approve_delete_request: ['admin'],
  manage_payouts: ['admin', 'finance'],
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Restore session on mount
    const savedToken = localStorage.getItem('vte_token');
    const savedUser = localStorage.getItem('vte_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    // Theme sync
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('class', 'dark');
    }
    
    setLoading(false);
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const login = async (loginIdentifier, password, role) => {
    try {
      const res = await apiClient.post('/auth/login', { loginIdentifier, password, role });
      if (res.data.success) {
        const { token: jwtToken, user: userProfile } = res.data;
        localStorage.setItem('vte_token', jwtToken);
        localStorage.setItem('vte_user', JSON.stringify(userProfile));
        setToken(jwtToken);
        setUser(userProfile);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (error) {
      console.error('Login request failed:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Connection error. Please check your credentials.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('vte_token');
    localStorage.removeItem('vte_user');
    setToken(null);
    setUser(null);
  };

  const hasPermission = (action) => {
    if (!user) return false;
    const allowed = permissionsMap[action];
    return allowed ? allowed.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      hasPermission,
      darkMode,
      toggleDarkMode
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
