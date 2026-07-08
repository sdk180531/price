// 결제 실패 화면 — 네이티브는 requestPayment 실패 result, 웹은 failUrl 리다이렉트로 진입
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KarrotColors, Radius } from '@/theme/karrot';

export default function PaymentFailScreen() {
  const { code, message, orderId } = useLocalSearchParams<{
    code?: string;
    message?: string;
    orderId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Ionicons name="close-circle" size={64} color={KarrotColors.danger} />
        </View>
        <Text style={styles.title}>결제가 취소되었어요</Text>
        <Text style={styles.message}>{message ?? '결제가 완료되지 않았습니다.'}</Text>
        <View style={styles.infoBox}>
          <Row label="에러코드" value={code ?? '-'} />
          {orderId ? <Row label="주문번호" value={orderId} /> : null}
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnGhost, pressed && { opacity: 0.7 }]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        >
          <Text style={styles.btnGhostText}>다시 시도</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && { backgroundColor: KarrotColors.primaryDark }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.btnPrimaryText}>홈으로</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
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
    backgroundColor: '#FFECEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: KarrotColors.text, textAlign: 'center' },
  message: { fontSize: 14, color: KarrotColors.subText, textAlign: 'center', lineHeight: 20 },
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
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KarrotColors.border,
  },
  btn: { flex: 1, borderRadius: Radius.md, paddingVertical: 15, alignItems: 'center' },
  btnGhost: { backgroundColor: KarrotColors.bgGray },
  btnGhostText: { color: KarrotColors.text, fontSize: 16, fontWeight: '700' },
  btnPrimary: { backgroundColor: KarrotColors.primary },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
