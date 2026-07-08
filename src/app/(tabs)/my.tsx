import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/store/AuthStore';
import { usePoints } from '@/store/PointsStore';
import { KarrotColors, Radius } from '@/theme/karrot';

const MENU: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'receipt-outline', label: '내 판매내역' },
  { icon: 'bag-handle-outline', label: '내 구매내역' },
  { icon: 'heart-outline', label: '관심목록' },
  { icon: 'time-outline', label: '최근 본 상품' },
  { icon: 'megaphone-outline', label: '판매 광고' },
  { icon: 'settings-outline', label: '설정' },
];

const TEMPERATURE = 36.5;

export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const pct = Math.min(100, (TEMPERATURE / 99) * 100);
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { points, pointPolicy } = usePoints();

  const onLogout = () => {
    // 웹은 Alert 버튼 콜백이 제한적이라 confirm 사용
    if (Platform.OS === 'web') {
      if (window.confirm('로그아웃 하시겠어요?')) signOut();
      return;
    }
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.headerTitle}>나의 당근</Text>
        <Ionicons name="settings-outline" size={24} color={KarrotColors.text} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 프로필 */}
        <View style={styles.profile}>
          <Image source="https://i.pravatar.cc/150?img=68" style={styles.avatar} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.name}>{session?.name ?? '당근이'}</Text>
            <Text style={styles.location}>{session?.email ?? '역삼동'}</Text>
          </View>
          <View style={styles.editBtn}>
            <Text style={styles.editText}>프로필 보기</Text>
          </View>
        </View>

        {/* 포인트 */}
        <View style={styles.pointCard}>
          <View style={styles.pointRow}>
            <View style={styles.pointLeft}>
              <Ionicons name="server-outline" size={20} color={KarrotColors.primary} />
              <Text style={styles.pointLabel}>내 포인트</Text>
            </View>
            <Text style={styles.pointValue}>{points.toLocaleString('ko-KR')}P</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.referralBtn, pressed && { backgroundColor: KarrotColors.primaryDark }]}
            onPress={() => router.push('/referral')}
          >
            <Ionicons name="gift-outline" size={16} color="#fff" />
            <Text style={styles.referralText}>
              친구 초대하고 {pointPolicy.referralReward.toLocaleString('ko-KR')}P 받기
            </Text>
          </Pressable>
        </View>

        {/* 매너온도 */}
        <View style={styles.tempCard}>
          <View style={styles.tempTop}>
            <Text style={styles.tempLabel}>매너온도</Text>
            <Text style={styles.tempValue}>{TEMPERATURE}°C</Text>
          </View>
          <View style={styles.tempBar}>
            <View style={[styles.tempFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.tempFace}>😊 첫 매너온도로 시작해요</Text>
        </View>

        <View style={styles.divider} />

        {/* 메뉴 */}
        {MENU.map((m) => (
          <View key={m.label} style={styles.menuItem}>
            <Ionicons name={m.icon} size={22} color={KarrotColors.text} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={KarrotColors.lightText} />
          </View>
        ))}

        {/* 로그아웃 */}
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: KarrotColors.bgGray }]}
          onPress={onLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={KarrotColors.danger} />
          <Text style={[styles.menuLabel, { color: KarrotColors.danger }]}>로그아웃</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KarrotColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 19, fontWeight: '700', color: KarrotColors.text },
  profile: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  avatar: { width: 62, height: 62, borderRadius: Radius.lg, backgroundColor: KarrotColors.lightBorder },
  name: { fontSize: 18, fontWeight: '700', color: KarrotColors.text },
  location: { fontSize: 14, color: KarrotColors.subText, marginTop: 3 },
  editBtn: {
    borderWidth: 1,
    borderColor: KarrotColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editText: { fontSize: 13, color: KarrotColors.text, fontWeight: '500' },
  pointCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: Radius.lg,
    backgroundColor: KarrotColors.primarySoft,
    gap: 12,
  },
  pointRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pointLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointLabel: { fontSize: 15, fontWeight: '600', color: KarrotColors.text },
  pointValue: { fontSize: 22, fontWeight: '800', color: KarrotColors.primary },
  referralBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: KarrotColors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
  },
  referralText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tempCard: { paddingHorizontal: 20, paddingBottom: 16 },
  tempTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tempLabel: { fontSize: 13, color: KarrotColors.subText },
  tempValue: { fontSize: 13, fontWeight: '700', color: KarrotColors.primary },
  tempBar: {
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: KarrotColors.lightBorder,
    overflow: 'hidden',
  },
  tempFill: { height: 8, borderRadius: Radius.full, backgroundColor: KarrotColors.primary },
  tempFace: { fontSize: 12, color: KarrotColors.subText, marginTop: 8 },
  divider: { height: 8, backgroundColor: KarrotColors.bgGray },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KarrotColors.border,
  },
  menuLabel: { flex: 1, fontSize: 15, color: KarrotColors.text },
});
