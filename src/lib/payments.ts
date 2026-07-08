// 토스페이먼츠 결제위젯 공통 설정 + 승인(confirm) 유틸
//
// ⚠️ 주의: 이 프로젝트는 "테스트 전용"으로 시크릿키를 클라이언트에서 직접 사용합니다.
//    실서비스에서는 시크릿키를 절대 클라이언트에 두지 말고, 반드시 서버(백엔드)에서
//    승인(confirm) API를 호출하세요. (서버에 orderId/amount를 먼저 저장해 위변조도 검증)
//
// Expo 환경변수는 EXPO_PUBLIC_ 접두사가 붙어야 클라이언트에서 접근할 수 있고,
// process.env.EXPO_PUBLIC_XXX 형태의 "정적 점 표기법"으로만 인라인됩니다.

export const TOSS_CLIENT_KEY = process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY ?? '';
export const TOSS_SECRET_KEY = process.env.EXPO_PUBLIC_TOSS_SECRET_KEY ?? '';

// 네이티브 결제위젯용 customerKey.
// RN SDK에는 웹 JS SDK의 ANONYMOUS 같은 익명 sentinel이 없어, 유효한 문자열이 필요합니다.
// (영문/숫자/-_=.@ 포함 2~50자) 앱 세션 동안 고정되는 게스트 키를 사용합니다.
// 회원 서비스라면 실제 회원 식별자로 대체하세요.
export const CUSTOMER_KEY = `guest_${Math.random().toString(36).slice(2, 12)}`;

export const CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

/** 주문마다 고유해야 하는 orderId 생성 (영문/숫자/-,_,= 6~64자) */
export function generateOrderId(prefix = 'order'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

/** orderName 은 최대 100자 */
export function toOrderName(title: string): string {
  return title.length > 100 ? `${title.slice(0, 97)}...` : title;
}

// RN/웹 어디서든 동작하는 ASCII base64 인코더 (시크릿키는 ASCII라 안전)
function base64(input: string): string {
  if (typeof btoa === 'function') return btoa(input);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < input.length; i += 3) {
    const c1 = input.charCodeAt(i);
    const c2 = input.charCodeAt(i + 1);
    const c3 = input.charCodeAt(i + 2);
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (c2 >> 4);
    const e3 = Number.isNaN(c2) ? 64 : ((c2 & 15) << 2) | (c3 >> 6);
    const e4 = Number.isNaN(c3) ? 64 : c3 & 63;
    out += chars[e1] + chars[e2] + chars[e3] + chars[e4];
  }
  return out;
}

/** 시크릿키로 Basic 인증 헤더 생성: Basic base64("{secretKey}:") */
export function authHeader(): string {
  return `Basic ${base64(`${TOSS_SECRET_KEY}:`)}`;
}

export interface ConfirmParams {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface ConfirmResult {
  ok: boolean;
  status: number;
  /** 성공 시 결제 객체, 실패 시 { code, message } */
  data: any;
}

/**
 * 결제 승인 API 호출. successUrl/RN Promise 로 받은 paymentKey·orderId·amount 를 그대로 넘기세요.
 * 웹(브라우저)에서는 CORS 로 직접 호출이 막힐 수 있습니다. 그때는 서버에서 호출해야 합니다.
 */
export async function confirmPayment({
  paymentKey,
  orderId,
  amount,
}: ConfirmParams): Promise<ConfirmResult> {
  const res = await fetch(CONFIRM_URL, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
