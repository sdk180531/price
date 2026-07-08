// 포인트 상태 관리 — Supabase user_points 테이블 + add_points/친구추천 RPC
//
// 사전 준비(Supabase SQL Editor): user_points, profiles 테이블 + RLS +
//   add_points / get_my_referral_code / redeem_referral 함수 생성 필요.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuth } from '@/store/AuthStore';

export const REFERRAL_REWARD = 1000;

export interface RedeemResult {
  ok: boolean;
  reason?: 'empty' | 'invalid_code' | 'self' | 'already_referred' | string;
}

interface PointsState {
  points: number;
  loading: boolean;
  refresh: () => Promise<void>;
  /** 포인트 차감 (결제 등) → 새 잔액 반환 */
  spend: (amount: number) => Promise<number>;
  /** 내 초대코드 조회(없으면 생성) */
  getReferralCode: () => Promise<string>;
  /** 초대코드 사용 → 추천인·본인 각 1,000P (결과 반환) */
  redeemReferral: (code: string) => Promise<RedeemResult>;
}

const PointsContext = createContext<PointsState | null>(null);

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session || !isSupabaseConfigured) {
      setPoints(0);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('user_points').select('balance').maybeSingle();
      if (!error) setPoints(data?.balance ?? 0);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const spend = useCallback(
    async (amount: number) => {
      if (!isSupabaseConfigured) throw new Error('Supabase 설정이 필요해요.');
      if (!session) throw new Error('로그인이 필요해요.');
      const { data, error } = await supabase.rpc('add_points', { delta: -Math.abs(amount) });
      if (error) throw new Error(error.message);
      const newBalance = typeof data === 'number' ? data : Math.max(0, points - amount);
      setPoints(newBalance);
      return newBalance;
    },
    [points, session],
  );

  const getReferralCode = useCallback(async () => {
    if (!isSupabaseConfigured) throw new Error('Supabase 설정이 필요해요.');
    const { data, error } = await supabase.rpc('get_my_referral_code');
    if (error) throw new Error(error.message);
    return String(data);
  }, []);

  const redeemReferral = useCallback(
    async (code: string) => {
      if (!isSupabaseConfigured) throw new Error('Supabase 설정이 필요해요.');
      const { data, error } = await supabase.rpc('redeem_referral', { code });
      if (error) throw new Error(error.message);
      await refresh(); // 내 포인트 갱신
      return (data ?? { ok: false }) as RedeemResult;
    },
    [refresh],
  );

  const value = useMemo<PointsState>(
    () => ({ points, loading, refresh, spend, getReferralCode, redeemReferral }),
    [points, loading, refresh, spend, getReferralCode, redeemReferral],
  );

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>;
}

export function usePoints(): PointsState {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error('usePoints must be used within PointsProvider');
  return ctx;
}
