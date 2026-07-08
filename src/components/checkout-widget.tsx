// 네이티브(iOS/Android) 결제위젯 — 토스페이먼츠 React Native SDK + 포인트 사용
// (웹에서는 checkout-widget.web.tsx 가 대신 번들됩니다)
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AgreementWidget,
  PaymentMethodWidget,
  PaymentWidgetProvider,
  usePaymentWidget,
} from '@tosspayments/widget-sdk-react-native';
import type {
  AgreementWidgetControl,
  PaymentMethodWidgetControl,
} from '@tosspayments/widget-sdk-react-native';
import type { Product } from '@/data/types';
import { formatPrice } from '@/lib/format';
import { usePoints } from '@/store/PointsStore';
import { KarrotColors, Radius } from '@/theme/karrot';
import { CUSTOMER_KEY, TOSS_CLIENT_KEY, generateOrderId, toOrderName } from '@/lib/payments';

export function CheckoutWidget({ product }: { product: Product }) {
  return (
    <PaymentWidgetProvider clientKey={TOSS_CLIENT_KEY} customerKey={CUSTOMER_KEY}>
      <Checkout price={product.price} orderName={toOrderName(product.title)} />
    </PaymentWidgetProvider>
  );
}

function Checkout({ price, orderName }: { price: number; orderName: string }) {
  const paymentWidgetControl = usePaymentWidget();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { points } = usePoints();
  const orderId = useMemo(() => generateOrderId(), []);

  const [methodControl, setMethodControl] = useState<PaymentMethodWidgetControl | null>(null);
  const [agreementControl, setAgreementControl] = useState<AgreementWidgetControl | null>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [paying, setPaying] = useState(false);
  const requested = useRef(false);

  const maxUsable = Math.min(points, price);
  const finalAmount = price - pointsToUse;
  const widgetsReady = methodControl != null && agreementControl != null;
  const canPay = finalAmount === 0 ? true : widgetsReady; // 전액 포인트면 위젯 불필요

  // 포인트 사용액이 바뀌면 위젯 금액 갱신 (토스는 0원 미지원 → 0원은 위젯 없이 처리)
  useEffect(() => {
    if (methodControl && finalAmount > 0) {
      methodControl.updateAmount(finalAmount).catch(() => {});
    }
  }, [finalAmount, methodControl]);

  const onChangePoints = (t: string) => {
    const n = Math.min(maxUsable, Number(t.replace(/[^0-9]/g, '')) || 0);
    setPointsToUse(n);
  };

  const goSuccess = (extra: Record<string, string>) =>
    router.replace({
      pathname: '/payment/success',
      params: { orderId, pointsUsed: String(pointsToUse), ...extra },
    });

  const onPay = async () => {
    if (requested.current) return;

    // 전액 포인트 결제 — 토스 없이 처리
    if (finalAmount === 0) {
      requested.current = true;
      goSuccess({ amount: '0' });
      return;
    }

    if (!agreementControl) return;
    const agreement = await agreementControl.getAgreementStatus();
    if (agreement.agreedRequiredTerms !== true) {
      Alert.alert('약관 동의 필요', '필수 이용약관에 동의해주세요.');
      return;
    }

    requested.current = true;
    setPaying(true);
    try {
      const result = await paymentWidgetControl.requestPayment?.({ orderId, orderName });
      if (result?.success) {
        goSuccess({
          paymentKey: result.success.paymentKey,
          orderId: result.success.orderId,
          amount: String(result.success.amount),
        });
      } else if (result?.fail) {
        const code = result.fail.code;
        // 결제수단/필수 정보 미선택류 에러 → 취소 화면으로 보내지 말고 결제 화면에 머물며 안내
        const STAY_CODES = [
          'NEED_CARD_PAYMENT_DETAIL',
          'NEED_REFUND_ACCOUNT_DETAIL',
          'NEED_AGREEMENT_WITH_REQUIRED_TERMS',
        ];
        if (STAY_CODES.includes(code)) {
          requested.current = false;
          Alert.alert(
            '결제 정보를 확인해주세요',
            result.fail.message || '결제 수단과 필요한 정보를 먼저 선택해주세요.',
          );
        } else {
          router.replace({
            pathname: '/payment/fail',
            params: { code, message: result.fail.message },
          });
        }
      } else {
        requested.current = false; // 결제창을 닫은 경우 등 재시도 허용
      }
    } catch (e: any) {
      requested.current = false;
      Alert.alert('결제 오류', e?.message ?? '결제 요청 중 문제가 발생했어요.');
    } finally {
      setPaying(false);
    }
  };

  const onCancel = () => {
    if (paying) return; // 결제 진행 중엔 취소 막기
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  };

  const payLabel = finalAmount === 0 ? '포인트로 결제하기' : `${formatPrice(finalAmount)} 결제하기`;

  return (
    <>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {/* 주문 요약 */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>주문 상품</Text>
          <Text style={styles.summaryName} numberOfLines={2}>
            {orderName}
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

        {/* 위젯 로딩 표시 */}
        {finalAmount > 0 && !widgetsReady && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={KarrotColors.primary} />
            <Text style={styles.stateText}>결제 수단을 불러오는 중이에요…</Text>
          </View>
        )}

        {/* 결제수단/약관 위젯 — 전액 포인트면 숨김 */}
        {finalAmount > 0 && (
          <>
            <View style={styles.widgetSlot}>
              <PaymentMethodWidget
                selector="payment-methods"
                onLoadEnd={() => {
                  paymentWidgetControl
                    .renderPaymentMethods('payment-methods', { value: finalAmount }, { variantKey: 'DEFAULT' })
                    .then(setMethodControl)
                    .catch((e) => console.error('[결제위젯] 결제수단 렌더 실패', e));
                }}
              />
            </View>
            <View style={styles.widgetSlot}>
              <AgreementWidget
                selector="agreement"
                onLoadEnd={() => {
                  paymentWidgetControl
                    .renderAgreement('agreement', { variantKey: 'AGREEMENT' })
                    .then(setAgreementControl)
                    .catch((e) => console.error('[결제위젯] 약관 렌더 실패', e));
                }}
              />
            </View>
          </>
        )}
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
  widgetSlot: { minHeight: 40 },
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
