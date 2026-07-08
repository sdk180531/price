// 결제 성공 화면 — 여기서 승인(confirm) API를 호출해 결제를 최종 완료합니다.
// 네이티브: requestPayment Promise 성공 후 이 화면으로 이동(params 전달)
// 웹: 토스가 successUrl 로 리다이렉트하며 ?paymentKey=&orderId=&amount= 를 붙여줌
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatPrice } from '@/lib/format';
import { confirmPayment } from '@/lib/payments';
import { usePoints } from '@/store/PointsStore';
import { KarrotColors, Radius } from '@/theme/karrot';

type Phase = 'confirming' | 'done' | 'error';

export default function PaymentSuccessScreen() {
  const { paymentKey, orderId, amount, pointsUsed } = useLocalSearchParams<{
    paymentKey?: string;
    orderId?: string;
    amount?: string;
    pointsUsed?: string;
  }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { spend, refresh } = usePoints();

  const [phase, setPhase] = useState<Phase>('confirming');
  const [message, setMessage] = useState('');
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const once = useRef(false);

  const pointsUsedNum = Number(pointsUsed ?? 0);

  useEffect(() => {
    if (once.current) return; // 한 번만
    once.current = true;

    (async () => {
      // 사용한 포인트를 차감 (실패해도 결제 자체는 유지)
      const deductPoints = async () => {
        if (pointsUsedNum > 0) {
          try {
            await spend(pointsUsedNum);
          } catch {
            await refresh();
          }
        }
      };

      // 전액 포인트 결제 (토스 승인 없음)
      if (!paymentKey) {
        if (!orderId) {
          setPhase('error');
          setMessage('주문 정보가 없습니다.');
          return;
        }
        await deductPoints();
        setPhase('done');
        return;
      }

      // 토스 결제 승인
      if (!orderId || !amount) {
        setPhase('error');
        setMessage('결제 정보(orderId/amount)가 없습니다.');
        return;
      }
      try {
        const r = await confirmPayment({ paymentKey, orderId, amount: Number(amount) });
        if (r.ok) {
          setApprovedAt(r.data?.approvedAt ?? null);
          await deductPoints();
          setPhase('done');
        } else {
          setPhase('error');
          setMessage(r.data?.message ?? `승인 실패 (HTTP ${r.status})`);
        }
      } catch (e: any) {
        setPhase('error');
        setMessage(
          `${e?.message ?? '승인 요청 실패'}\n(웹 브라우저에서는 CORS로 승인 API 직접 호출이 막힐 수 있어요. 실서비스는 서버에서 승인하세요.)`,
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amountNum = Number(amount ?? 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {phase === 'confirming' && (
          <>
            <ActivityIndicator size="large" color={KarrotColors.primary} />
            <Text style={styles.title}>결제를 승인하고 있어요…</Text>
          </>
        )}

        {phase === 'done' && (
          <>
            <View style={[styles.badge, { backgroundColor: KarrotColors.primarySoft }]}>
              <Ionicons name="checkmark-circle" size={64} color={KarrotColors.primary} />
            </View>
            <Text style={styles.title}>결제가 완료됐어요</Text>
            <Text style={styles.amount}>{amountNum > 0 ? formatPrice(amountNum) : '0원'}</Text>
            <View style={styles.infoBox}>
              <Row label="주문번호" value={orderId ?? '-'} />
              {pointsUsedNum > 0 ? (
                <Row label="사용 포인트" value={`${pointsUsedNum.toLocaleString('ko-KR')}P`} />
              ) : null}
              {paymentKey ? <Row label="결제키" value={paymentKey} /> : null}
              {approvedAt ? <Row label="승인시각" value={approvedAt} /> : null}
            </View>
          </>
        )}

        {phase === 'error' && (
          <>
            <View style={[styles.badge, { backgroundColor: '#FFECEC' }]}>
              <Ionicons name="alert-circle" size={64} color={KarrotColors.danger} />
            </View>
            <Text style={styles.title}>결제 승인에 실패했어요</Text>
            <Text style={styles.errorMsg}>{message}</Text>
            <View style={styles.infoBox}>
              <Row label="주문번호" value={orderId ?? '-'} />
              <Row label="결제키" value={paymentKey ?? '-'} />
            </View>
          </>
        )}
      </ScrollView>

      {phase !== 'confirming' && (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable
            style={({ pressed }) => [styles.homeBtn, pressed && { backgroundColor: KarrotColors.primaryDark }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.homeText}>홈으로</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KarrotColors.background },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: KarrotColors.text, textAlign: 'center' },
  amount: { fontSize: 24, fontWeight: '800', color: KarrotColors.primary, marginTop: 4 },
  errorMsg: { fontSize: 14, color: KarrotColors.subText, textAlign: 'center', lineHeight: 20 },
  infoBox: {
    width: '100%',
    backgroundColor: KarrotColors.bgGray,
    borderRadius: Radius.md,
    padding: 16,
    marginTop: 12,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 13, color: KarrotColors.subText },
  rowValue: { fontSize: 13, color: KarrotColors.text, flexShrink: 1, textAlign: 'right' },
  bottom: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KarrotColors.border,
  },
  homeBtn: {
    backgroundColor: KarrotColors.primary,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  homeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
