import { createContext, useContext, useState, ReactNode } from 'react';

type SessionContextValue = { role: 'patient' | 'admin'; setRole: (role: 'patient' | 'admin') => void };
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<'patient' | 'admin'>('patient');
  return <SessionContext.Provider value={{ role, setRole }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
