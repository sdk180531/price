import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Product } from '@/data/types';
import { formatPrice } from '@/lib/format';
import { KarrotColors, Radius } from '@/theme/karrot';

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: KarrotColors.bgGray }]}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
    >
      <Image source={product.images[0]} style={styles.thumb} contentFit="cover" transition={150} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.meta}>
          {product.location} · {product.timeAgo}
        </Text>
        <View style={styles.priceRow}>
          {product.status !== '판매중' && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{product.status}</Text>
            </View>
          )}
          <Text style={[styles.price, product.price === 0 && { color: KarrotColors.primary }]}>
            {formatPrice(product.price)}
          </Text>
        </View>
        <View style={styles.counts}>
          {product.chats > 0 && (
            <View style={styles.countItem}>
              <Ionicons name="chatbubble-outline" size={14} color={KarrotColors.lightText} />
              <Text style={styles.countText}>{product.chats}</Text>
            </View>
          )}
          {product.likes > 0 && (
            <View style={styles.countItem}>
              <Ionicons name="heart-outline" size={14} color={KarrotColors.lightText} />
              <Text style={styles.countText}>{product.likes}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KarrotColors.border,
  },
  thumb: {
    width: 108,
    height: 108,
    borderRadius: Radius.md,
    backgroundColor: KarrotColors.lightBorder,
  },
  info: { flex: 1, marginLeft: 14, justifyContent: 'flex-start' },
  title: { fontSize: 16, color: KarrotColors.text, lineHeight: 21 },
  meta: { fontSize: 13, color: KarrotColors.subText, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  price: { fontSize: 16, fontWeight: '700', color: KarrotColors.text },
  statusBadge: {
    backgroundColor: '#4B5563',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  counts: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  countItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  countText: { fontSize: 13, color: KarrotColors.lightText },
});
