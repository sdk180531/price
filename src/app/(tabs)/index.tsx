import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from '@/components/ProductCard';
import { useApp } from '@/store/AppStore';
import { KarrotColors, Radius } from '@/theme/karrot';

export default function HomeScreen() {
  const { products } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable style={styles.locationBtn}>
          <Text style={styles.locationText}>역삼동</Text>
          <Ionicons name="chevron-down" size={20} color={KarrotColors.text} />
        </Pressable>
        <View style={styles.headerIcons}>
          <Ionicons name="search-outline" size={25} color={KarrotColors.text} />
          <Ionicons name="menu-outline" size={26} color={KarrotColors.text} />
          <Ionicons name="notifications-outline" size={24} color={KarrotColors.text} />
        </View>
      </View>

      {/* 상품 목록 */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* 글쓰기 플로팅 버튼 */}
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { bottom: 20 },
          pressed && { backgroundColor: KarrotColors.primaryDark },
        ]}
        onPress={() => router.push('/new')}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.fabText}>글쓰기</Text>
      </Pressable>
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
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  locationText: { fontSize: 19, fontWeight: '700', color: KarrotColors.text },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: KarrotColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
