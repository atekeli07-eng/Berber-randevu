import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSupabase } from "./supabase";

type AuthValue = {
  ready: boolean;
  session: Session | null;
  configError: string | null;
};

const AuthContext = createContext<AuthValue>({ ready: false, session: null, configError: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe = () => {};
    try {
      const supabase = getSupabase();
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setReady(true);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, next) => {
        setSession(next);
        setReady(true);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch (error) {
      setConfigError(error instanceof Error ? error.message : "Yapılandırma hatası");
      setReady(true);
    }
    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({ ready, session, configError }), [ready, session, configError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}
