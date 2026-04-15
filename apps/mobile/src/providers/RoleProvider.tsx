import React, { createContext, useContext } from 'react';

import { useAppStore } from '../store/appStore';

interface RoleContextValue {
  currentRole: 'customer' | 'tasker';
  switchRole: () => void;
  setRole: (role: 'customer' | 'tasker') => void;
  isCustomer: boolean;
  isTasker: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const currentRole = useAppStore((s) => s.currentRole);
  const setRole = useAppStore((s) => s.setRole);

  const value: RoleContextValue = {
    currentRole,
    setRole,
    switchRole: () => setRole(currentRole === 'customer' ? 'tasker' : 'customer'),
    isCustomer: currentRole === 'customer',
    isTasker: currentRole === 'tasker',
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
