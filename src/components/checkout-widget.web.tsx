// 웹(브라우저) 결제위젯 — 토스페이먼츠 JS SDK v2 + 포인트 사용
// (네이티브에서는 checkout-widget.tsx 가 대신 번들됩니다)
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk';
import type { Product } from '@/data/types';
import { formatPrice } from '@/lib/format';
import { usePoints } from '@/store/PointsStore';
import { KarrotColors, Radius } from '@/theme/karrot';
import { TOSS_CLIENT_KEY, generateOrderId, toOrderName } from '@/lib/payments';

type Phase = 'loading' | 'ready' | 'error';

export function CheckoutWidget({ product }: { product: Product }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { points } = usePoints();
  const price = product.price;
  const orderId = useMemo(() => generateOrderId(), []);

  const widgetsRef = useRef<any>(null);
  const initialized = useRef(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [pointsToUse, setPointsToUse] = useState(0);
  const [paying, setPaying] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const maxUsable = Math.min(points, price);
  const finalAmount = price - pointsToUse;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    let cancelled = false;
    (async () => {
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
        widgetsRef.current = widgets;
        await widgets.setAmount({ currency: 'KRW', value: price });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
        ]);
        if (!cancelled) setPhase('ready');
      } catch (e) {
        console.error('[결제위젯] 로드 실패', e);
        if (!cancelled) setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // 포인트 사용액이 바뀌면 위젯 금액 갱신 (0원은 토스 미사용)
  useEffect(() => {
    if (phase === 'ready' && widgetsRef.current && finalAmount > 0) {
      widgetsRef.current.setAmount({ currency: 'KRW', value: finalAmount });
    }
  }, [finalAmount, phase]);

  const retry = () => {
    initialized.current = false;
    widgetsRef.current = null;
    setPhase('loading');
    setReloadKey((k) => k + 1);
  };

  const onChangePoints = (t: string) => {
    setPointsToUse(Math.min(maxUsable, Number(t.replace(/[^0-9]/g, '')) || 0));
  };

  const canPay = finalAmount === 0 ? true : phase === 'ready';
  const payLabel = finalAmount === 0 ? '포인트로 결제하기' : `${formatPrice(finalAmount)} 결제하기`;

  const onCancel = () => {
    if (paying) return; // 결제 진행 중엔 취소 막기
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  };

  const onPay = async () => {
    // 전액 포인트 결제 — 토스 없이 성공 화면으로
    if (finalAmount === 0) {
      router.replace({
        pathname: '/payment/success',
        params: { orderId, amount: '0', pointsUsed: String(pointsToUse) },
      });
      return;
    }
    const widgets = widgetsRef.current;
    if (!widgets) return;
    setPaying(true);
    try {
      // 포인트 사용액을 successUrl 쿼리로 전달 (토스가 paymentKey/orderId/amount 를 추가로 붙임)
      await widgets.requestPayment({
        orderId,
        orderName: toOrderName(product.title),
        successUrl: `${window.location.origin}/payment/success?pointsUsed=${pointsToUse}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (e: any) {
      setPaying(false);
      window.alert(e?.message ?? '결제 요청 중 문제가 발생했어요. (약관 동의를 확인하세요)');
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {/* 주문 요약 */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>주문 상품</Text>
          <Text style={styles.summaryName} numberOfLines={2}>
            {toOrderName(product.title)}
          </Text>
          <View style={styles.priceLine}>
            <Text style={styles.priceLineLabel}>상품 금액</Text>
            <Text style={styles.priceLineValue}>{formatPrice(price)}</Text>
          </View>
          {pointsToUse > 0 && (
            <View style={styles.priceLine}>
              <Text style={styles.priceLineLabel}>포인트 사용</Text>
              <Text style={[styles.priceLineValue, { color: KarrotColors.primary }]}>
                -{pointsToUse.toLocaleString('ko-KR')}P
              </Text>
            </View>
          )}
          <View style={[styles.amountRow, styles.amountRowBorder]}>
            <Text style={styles.amountLabel}>최종 결제 금액</Text>
            <Text style={styles.amountValue}>{formatPrice(finalAmount)}</Text>
          </View>
        </View>

        {/* 포인트 사용 */}
        {points > 0 && (
          <View style={styles.pointBox}>
            <View style={styles.pointHeader}>
              <Text style={styles.pointTitle}>포인트 사용</Text>
              <Text style={styles.pointBalance}>보유 {points.toLocaleString('ko-KR')}P</Text>
            </View>
            <View style={styles.pointInputRow}>
              <TextInput
                style={styles.pointInput}
                value={pointsToUse ? String(pointsToUse) : ''}
                onChangeText={onChangePoints}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={KarrotColors.lightText}
              />
              <Text style={styles.pointUnit}>P</Text>
              <Pressable style={styles.useAllBtn} onPress={() => setPointsToUse(maxUsable)}>
                <Text style={styles.useAllText}>전액 사용</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* 로딩 / 에러 (전액 포인트면 위젯 불필요) */}
        {finalAmount > 0 && phase === 'loading' && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={KarrotColors.primary} />
            <Text style={styles.stateText}>결제 수단을 불러오는 중이에요…</Text>
          </View>
        )}
        {finalAmount > 0 && phase === 'error' && (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>결제 수단을 불러오지 못했어요.</Text>
            <Pressable style={styles.retryBtn} onPress={retry}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        )}

        {/* 토스 결제위젯 컨테이너 (항상 마운트되어야 SDK 가 찾음) */}
        <View nativeID="payment-method" style={[styles.widgetSlot, finalAmount === 0 && styles.hidden]} />
        <View nativeID="agreement" style={[styles.widgetSlot, finalAmount === 0 && styles.hidden]} />
      </ScrollView>

      <View style={[styles.payBar, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.payRow}>
          <Pressable
            style={({ pressed }) => [styles.cancelBtn, pressed && !paying && { backgroundColor: KarrotColors.bgGray }]}
            disabled={paying}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>결제 취소</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.payBtn,
              styles.payBtnFlex,
              (!canPay || paying) && styles.payBtnDisabled,
              pressed && canPay && !paying && { backgroundColor: KarrotColors.primaryDark },
            ]}
            disabled={!canPay || paying}
            onPress={onPay}
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payText}>{canPay ? payLabel : '결제 준비 중…'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  summary: { padding: 16, borderBottomWidth: 8, borderBottomColor: KarrotColors.bgGray },
  summaryLabel: { fontSize: 13, color: KarrotColors.subText },
  summaryName: { fontSize: 16, fontWeight: '600', color: KarrotColors.text, marginTop: 6, marginBottom: 14 },
  priceLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  priceLineLabel: { fontSize: 14, color: KarrotColors.subText },
  priceLineValue: { fontSize: 14, color: KarrotColors.text, fontWeight: '500' },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountRowBorder: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KarrotColors.border,
  },
  amountLabel: { fontSize: 15, fontWeight: '600', color: KarrotColors.text },
  amountValue: { fontSize: 18, fontWeight: '700', color: KarrotColors.primary },
  pointBox: { padding: 16, borderBottomWidth: 8, borderBottomColor: KarrotColors.bgGray, gap: 12 },
  pointHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointTitle: { fontSize: 15, fontWeight: '600', color: KarrotColors.text },
  pointBalance: { fontSize: 13, color: KarrotColors.subText },
  pointInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointInput: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: KarrotColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    color: KarrotColors.text,
    textAlign: 'right',
    backgroundColor: KarrotColors.bgGray,
  },
  pointUnit: { fontSize: 15, color: KarrotColors.text, marginRight: 4 },
  useAllBtn: {
    paddingHorizontal: 14,
    height: 46,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: KarrotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useAllText: { color: KarrotColors.primary, fontWeight: '700', fontSize: 13 },
  stateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 12 },
  stateText: { fontSize: 14, color: KarrotColors.subText },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: KarrotColors.primary,
  },
  retryText: { color: KarrotColors.primary, fontWeight: '700' },
  widgetSlot: { minHeight: 40 },
  hidden: { display: 'none' },
  payBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KarrotColors.border,
    backgroundColor: '#fff',
  },
  payRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: KarrotColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: KarrotColors.subText, fontSize: 16, fontWeight: '700' },
  payBtn: {
    backgroundColor: KarrotColors.primary,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnFlex: { flex: 1 },
  payBtnDisabled: { backgroundColor: KarrotColors.lightText },
  payText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
