// 가격/숫자 포맷 유틸
export function formatPrice(price: number): string {
  if (price <= 0) return '나눔';
  return `${price.toLocaleString('ko-KR')}원`;
}

export function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return `${n}`;
}
