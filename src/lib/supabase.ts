// Supabase 클라이언트 (React Native / Expo)
// URL/anon key 는 공개돼도 안전한 값입니다. (RLS 로 보호)
// .env 에 아래 두 값을 넣으세요:
//   EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** .env 에 Supabase 값이 채워졌는지 여부 */
export const isSupabaseConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

// 웹 정적 렌더링(SSR, Node)에서는 window/localStorage 가 없어 AsyncStorage 가 크래시납니다.
// 그때만 메모리 스토리지로 대체합니다. (웹 클라이언트/네이티브는 AsyncStorage 사용)
const isWebSSR = Platform.OS === 'web' && typeof window === 'undefined';
const memory = new Map<string, string>();
const memoryStorage = {
  getItem: async (k: string) => memory.get(k) ?? null,
  setItem: async (k: string, v: string) => {
    memory.set(k, v);
  },
  removeItem: async (k: string) => {
    memory.delete(k);
  },
};

// 설정 전이라도 createClient 가 던지지 않도록 유효한 형태의 플레이스홀더를 사용
export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'public-anon-key-placeholder-value-0000000000',
  {
    auth: {
      storage: isWebSSR ? memoryStorage : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // OTP 코드 방식이라 URL 세션 감지 불필요
    },
  },
);

// 앱이 포그라운드일 때만 토큰 자동 갱신 (Supabase RN 권장)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
