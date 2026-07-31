
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { store } from '../lib/storage';
import type { Role, User } from '../lib/types';

interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  email: string;
}

interface Session {
  token: string;
  user: AuthUser;
  exp: number; // epoch ms
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => {ok: boolean;error?: string;role?: Role;};
  logout: (reason?: string) => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const SESSION_MINUTES = 60;
const SESSION_KEY = 'authSession';

// Simulated JWT (base64 payload) purely for realism in this frontend-only build.
function makeToken(user: AuthUser, exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: user.id, role: user.role, exp }));
  const sig = btoa(`${user.id}.${exp}`).slice(0, 24);
  return `${header}.${payload}.${sig}`;
}

export function AuthProvider({ children }: {children: React.ReactNode;}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onExpire = useRef<(() => void) | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const logout = useCallback((reason?: string) => {
    clearTimer();
    localStorage.removeItem(store.keys.auth);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    if (reason) {
      try {
        sessionStorage.setItem('sfms.logoutReason', reason);
      } catch {

        /* ignore */}
    }
  }, []);

  const scheduleExpiry = useCallback(
    (exp: number) => {
      clearTimer();
      const ms = exp - Date.now();
      if (ms <= 0) {
        logout('expired');
        return;
      }
      timer.current = setTimeout(() => {
        logout('expired');
        onExpire.current?.();
      }, ms);
    },
    [logout]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem(store.keys.auth);
      if (raw) {
        const session = JSON.parse(raw) as Session;
        const expiresAt = session.exp ?? Date.now() + SESSION_MINUTES * 60 * 1000;
        if (expiresAt > Date.now()) {
          setUser({
            ...session.user,
            role: String(session.user.role).toLowerCase() as Role
          });
          scheduleExpiry(expiresAt);
        } else {
          localStorage.removeItem(store.keys.auth);
          localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {

      /* ignore */}
    setLoading(false);
  }, [scheduleExpiry]);

  const login: AuthCtx['login'] = (username, password) => {
    const found = store.
    getUsers().
    find((u: User) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!found) return { ok: false, error: 'No account found with that username.' };
    if (found.password !== password) return { ok: false, error: 'Incorrect password. Please try again.' };
    if (found.status !== 'active')
    return { ok: false, error: 'This account is deactivated. Contact the administrator.' };

    const authUser: AuthUser = {
      id: found.id,
      name: found.name,
      username: found.username,
      role: found.role,
      email: found.email
    };
    const exp = Date.now() + SESSION_MINUTES * 60 * 1000;
    const session: Session = { token: makeToken(authUser, exp), user: authUser, exp };
    localStorage.setItem(store.keys.auth, JSON.stringify(session));
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(authUser);
    scheduleExpiry(exp);
    return { ok: true, role: found.role };
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>);

}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
