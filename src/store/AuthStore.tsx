// 인증 상태 관리 — Supabase Auth (실제 이메일 인증)
//
// .env 의 EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 가 채워지면 동작합니다.
// 미설정 시에는 앱이 죽지 않고 "설정 필요" 상태로 로그인 화면을 보여줍니다.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface User {
  email: string;
  name: string;
}

interface AuthState {
  session: User | null;
  loading: boolean;
  /** Supabase env 설정 여부 (false 면 설정 안내를 보여줌) */
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** 가입. 이메일 확인이 필요한 프로젝트 설정이면 needsConfirmation=true */
  signUp: (name: string, email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  /** 비밀번호 재설정: 이메일로 인증번호(OTP) 발송 */
  sendResetCode: (email: string) => Promise<void>;
  /** 인증번호 확인 후 새 비밀번호로 변경 (성공 시 해당 계정으로 로그인됨) */
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function toUser(session: Session | null): User | null {
  const u = session?.user;
  if (!u) return null;
  const name = (u.user_metadata?.name as string | undefined)?.trim();
  return { email: u.email ?? '', name: name || (u.email?.split('@')[0] ?? '사용자') };
}

// Supabase 에러 메시지를 한국어 안내로 변환
function mapError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (m.includes('email not confirmed')) return '이메일 인증이 필요해요. 받은 메일의 링크를 눌러 인증해주세요.';
  if (m.includes('already registered') || m.includes('already been registered')) return '이미 가입된 이메일이에요.';
  if (m.includes('signups not allowed for otp')) return '가입되지 않은 이메일이에요.';
  if (
    m.includes('token has expired') ||
    m.includes('otp_expired') ||
    m.includes('expired') ||
    (m.includes('invalid') && (m.includes('otp') || m.includes('token')))
  ) {
    return '인증번호가 만료됐거나 올바르지 않아요. 새 인증번호를 받아 가장 최근에 온 코드를 입력해주세요.';
  }
  if (m.includes('password should be at least')) return '비밀번호는 6자 이상이어야 해요.';
  if (m.includes('rate limit') || m.includes('too many') || m.includes('only request this after')) {
    return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
  }
  // 프로젝트 DB 문제 (예: auth.users 트리거 오류) — 사용자가 아니라 Supabase 설정에서 고쳐야 함
  if (m.includes('database error') || m.includes('unexpected')) {
    return '서버(Supabase) 처리 중 오류가 발생했어요. 프로젝트의 데이터베이스 설정(트리거)을 확인해주세요.';
  }
  return msg;
}

const requireConfig = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase 설정이 필요해요. .env 에 URL과 anon key를 넣고 앱을 새로고침하세요.');
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(toUser(data.session));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(toUser(s));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    requireConfig();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(mapError(error.message));
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    requireConfig();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (error) throw new Error(mapError(error.message));
    // 세션이 바로 생기면 이메일 확인 OFF, 없으면 확인 메일 발송됨
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const sendResetCode = useCallback(async (email: string) => {
    requireConfig();
    // 기존 가입자에게만 OTP 발송 (신규 생성 안 함)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    if (error) throw new Error(mapError(error.message));
  }, []);

  const resetPasswordWithCode = useCallback(
    async (email: string, code: string, newPassword: string) => {
      requireConfig();
      // 1) 인증번호 확인 → 세션 생성
      const { error: vErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      });
      if (vErr) throw new Error(mapError(vErr.message));
      // 2) 새 비밀번호로 변경
      const { error: uErr } = await supabase.auth.updateUser({ password: newPassword });
      if (uErr) throw new Error(mapError(uErr.message));
    },
    [],
  );

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      sendResetCode,
      resetPasswordWithCode,
    }),
    [session, loading, signIn, signUp, signOut, sendResetCode, resetPasswordWithCode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
