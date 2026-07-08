// 결제 화면 (라우트) — 플랫폼 분기는 CheckoutWidget 이 담당합니다.
// checkout-widget.tsx(네이티브) / checkout-widget.web.tsx(웹) 로 Metro 가 자동 선택합니다.
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckoutWidget } from '@/components/checkout-widget';
import { useApp } from '@/store/AppStore';
import { KarrotColors } from '@/theme/karrot';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const product = getProduct(id);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBack}>
        <Ionicons name="chevron-back" size={26} color={KarrotColors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>결제하기</Text>
      <View style={{ width: 26 }} />
    </View>
  );

  if (!product) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.center}>
          <Text style={styles.muted}>상품을 찾을 수 없어요.</Text>
        </View>
      </View>
    );
  }

  if (product.price <= 0) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.center}>
          <Text style={styles.muted}>나눔 상품은 결제가 필요 없어요.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <CheckoutWidget product={product} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KarrotColors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: KarrotColors.subText },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KarrotColors.border,
    backgroundColor: '#fff',
  },
  headerBack: { width: 26 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: KarrotColors.text },
});
