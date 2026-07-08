import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KarrotColors, Radius } from '@/theme/karrot';

const CATEGORIES = [
  { icon: 'restaurant-outline', label: '음식점' },
  { icon: 'cut-outline', label: '미용실' },
  { icon: 'cafe-outline', label: '카페' },
  { icon: 'barbell-outline', label: '운동' },
  { icon: 'medkit-outline', label: '병원' },
  { icon: 'car-outline', label: '자동차' },
  { icon: 'paw-outline', label: '반려동물' },
  { icon: 'ellipsis-horizontal', label: '더보기' },
] as const;

const PLACES = [
  { name: '역삼 김밥천국', category: '분식', rating: 4.7, reviews: 128, distance: '120m' },
  { name: '스타일 헤어살롱', category: '미용실', rating: 4.9, reviews: 342, distance: '250m' },
  { name: '동네 헬스장', category: '헬스/PT', rating: 4.6, reviews: 89, distance: '400m' },
  { name: '건강한 동물병원', category: '동물병원', rating: 4.8, reviews: 210, distance: '550m' },
];

export default function NearScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.headerTitle}>내 근처</Text>
        <Ionicons name="search-outline" size={25} color={KarrotColors.text} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {CATEGORIES.map((c) => (
            <View key={c.label} style={styles.gridItem}>
              <View style={styles.gridIcon}>
                <Ionicons name={c.icon} size={26} color={KarrotColors.primary} />
              </View>
              <Text style={styles.gridLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>우리 동네 인기 업체</Text>
        {PLACES.map((p) => (
          <View key={p.name} style={styles.place}>
            <View style={styles.placeThumb}>
              <Ionicons name="storefront-outline" size={26} color={KarrotColors.lightText} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.placeName}>{p.name}</Text>
              <Text style={styles.placeCategory}>
                {p.category} · {p.distance}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={KarrotColors.primary} />
                <Text style={styles.ratingText}>
                  {p.rating} · 후기 {p.reviews}
                </Text>
              </View>
            </View>
          </View>
        ))}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 12 },
  gridItem: { width: '25%', alignItems: 'center', marginVertical: 12 },
  gridIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: KarrotColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: { marginTop: 8, fontSize: 13, color: KarrotColors.text },
  divider: { height: 8, backgroundColor: KarrotColors.bgGray },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: KarrotColors.text,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KarrotColors.border,
  },
  placeThumb: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: KarrotColors.lightBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeName: { fontSize: 15, fontWeight: '600', color: KarrotColors.text },
  placeCategory: { fontSize: 13, color: KarrotColors.subText, marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText: { fontSize: 12, color: KarrotColors.subText },
});
