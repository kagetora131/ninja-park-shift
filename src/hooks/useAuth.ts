import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Profile, UserRole } from '../types';

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  error: string | null;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, employee_id, role')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, employeeId: data.employee_id, role: data.role as UserRole };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    profile: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const profile = session ? await fetchProfile(session.user.id) : null;
      if (active) setState({ loading: false, session, profile, error: null });
    }
    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session ? await fetchProfile(session.user.id) : null;
      if (active) setState({ loading: false, session, profile, error: null });
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState((s) => ({ ...s, error: 'メールアドレスまたはパスワードが正しくありません' }));
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    loading: state.loading,
    session: state.session,
    profile: state.profile,
    error: state.error,
    isAuthenticated: !!state.session,
    signIn,
    signOut,
  };
}
