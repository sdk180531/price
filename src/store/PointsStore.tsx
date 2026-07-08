// 포인트 상태 관리 — Supabase user_points 테이블 + add_points/친구추천 RPC
//
// 사전 준비(Supabase SQL Editor): user_points, profiles, point_policy 테이블 + RLS +
//   add_points / get_my_referral_code / redeem_referral 함수 생성 필요.
// 지급액(가입 보너스/추천 보상)은 point_policy 테이블 값이 실제 정책이며,
// 아래 DEFAULT_POINT_POLICY는 조회 실패 시에만 쓰이는 폴백값이다.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useAuth } from '@/store/AuthStore';

export interface PointPolicy {
  /** 초대코드로 가입한 사람(피추천인)에게 지급되는 금액 */
  signupBonus: number;
  /** 추천인에게 지급되는 금액 */
  referralReward: number;
}

export const DEFAULT_POINT_POLICY: PointPolicy = { signupBonus: 1000, referralReward: 1000 };

export interface RedeemResult {
  ok: boolean;
  reason?: 'empty' | 'invalid_code' | 'self' | 'already_referred' | string;
}

interface PointsState {
  points: number;
  loading: boolean;
  /** 가입/추천 지급액 정책 (point_policy 테이블에서 조회) */
  pointPolicy: PointPolicy;
  refresh: () => Promise<void>;
  /** 포인트 차감 (결제 등) → 새 잔액 반환 */
  spend: (amount: number) => Promise<number>;
  /** 내 초대코드 조회(없으면 생성) */
  getReferralCode: () => Promise<string>;
  /** 초대코드 사용 → 추천인·본인에게 point_policy 기준 포인트 지급 (결과 반환) */
  redeemReferral: (code: string) => Promise<RedeemResult>;
}

const PointsContext = createContext<PointsState | null>(null);

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pointPolicy, setPointPolicy] = useState<PointPolicy>(DEFAULT_POINT_POLICY);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    (async () => {
      const { data, error } = await supabase.from('point_policy').select('code, amount').eq('is_active', true);
      if (error || !data) return;
      const amountByCode = Object.fromEntries(data.map((row: { code: string; amount: number }) => [row.code, row.amount]));
      setPointPolicy({
        signupBonus: amountByCode.signup_bonus ?? DEFAULT_POINT_POLICY.signupBonus,
        referralReward: amountByCode.referral_reward ?? DEFAULT_POINT_POLICY.referralReward,
      });
    })();
  }, []);

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
    () => ({ points, loading, pointPolicy, refresh, spend, getReferralCode, redeemReferral }),
    [points, loading, pointPolicy, refresh, spend, getReferralCode, redeemReferral],
  );

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>;
}

export function usePoints(): PointsState {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error('usePoints must be used within PointsProvider');
  return ctx;
}
