import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/store/AppStore';
import { formatPrice } from '@/lib/format';
import { KarrotColors, Radius } from '@/theme/karrot';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct, toggleLike, openChatForProduct } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  const product = getProduct(id);

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={{ color: KarrotColors.subText }}>상품을 찾을 수 없어요.</Text>
      </View>
    );
  }

  const onChat = () => {
    const chatId = openChatForProduct(product);
    router.push({ pathname: '/chat/[id]', params: { id: chatId } });
  };

  const onBuy = () => {
    router.push({ pathname: '/checkout', params: { id: product.id } });
  };

  const isFree = product.price <= 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* 이미지 캐러셀 */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setPage(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {product.images.map((uri, i) => (
              <Image key={i} source={uri} style={{ width, height: width }} contentFit="cover" />
            ))}
          </ScrollView>
          {product.images.length > 1 && (
            <View style={styles.dots}>
              {product.images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === page && { backgroundColor: '#fff' }]}
                />
              ))}
            </View>
          )}
        </View>

        {/* 판매자 */}
        <View style={styles.sellerRow}>
          <Image source={product.seller.avatar} style={styles.sellerAvatar} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.sellerName}>{product.seller.name}</Text>
            <Text style={styles.sellerLoc}>{product.seller.location}</Text>
          </View>
          <View style={styles.tempWrap}>
            <Text style={styles.tempValue}>{product.seller.temperature}°C</Text>
            <Text style={styles.tempLabel}>매너온도</Text>
            <View style={styles.tempBar}>
              <View
                style={[
                  styles.tempFill,
                  { width: `${Math.min(100, (product.seller.temperature / 99) * 100)}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* 상품 정보 */}
        <View style={styles.body}>
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.category}>
            {product.category} · {product.timeAgo}
          </Text>
          <Text style={styles.desc}>{product.description}</Text>
          <Text style={styles.stats}>
            관심 {product.likes} · 채팅 {product.chats} · 조회 {product.views}
          </Text>
        </View>
      </ScrollView>

      {/* 상단 뒤로가기 (오버레이) */}
      <Pressable
        style={[styles.backBtn, { top: insets.top + 6 }]}
        onPress={() => router.back()}
        hitSlop={10}
      >
        <Ionicons name="chevron-back" size={26} color="#fff" />
      </Pressable>

      {/* 하단 바 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable style={styles.likeBtn} onPress={() => toggleLike(product.id)} hitSlop={8}>
          <Ionicons
            name={product.liked ? 'heart' : 'heart-outline'}
            size={28}
            color={product.liked ? KarrotColors.danger : KarrotColors.subText}
          />
        </Pressable>
        <View style={styles.priceBox}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>
        {isFree ? (
          <Pressable
            style={({ pressed }) => [styles.chatBtn, pressed && { backgroundColor: KarrotColors.primaryDark }]}
            onPress={onChat}
          >
            <Text style={styles.chatText}>채팅하기</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.chatOutlineBtn, pressed && { backgroundColor: KarrotColors.primarySoft }]}
              onPress={onChat}
            >
              <Text style={styles.chatOutlineText}>채팅</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.buyBtn, pressed && { backgroundColor: KarrotColors.primaryDark }]}
              onPress={onBuy}
            >
              <Text style={styles.buyText}>구매하기</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KarrotColors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  backBtn: {
    position: 'absolute',
    left: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sellerRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: KarrotColors.lightBorder },
  sellerName: { fontSize: 15, fontWeight: '700', color: KarrotColors.text },
  sellerLoc: { fontSize: 13, color: KarrotColors.subText, marginTop: 2 },
  tempWrap: { alignItems: 'flex-end', width: 96 },
  tempValue: { fontSize: 15, fontWeight: '700', color: KarrotColors.primary },
  tempLabel: { fontSize: 10, color: KarrotColors.lightText },
  tempBar: {
    height: 5,
    width: 80,
    borderRadius: Radius.full,
    backgroundColor: KarrotColors.lightBorder,
    marginTop: 4,
    overflow: 'hidden',
  },
  tempFill: { height: 5, borderRadius: Radius.full, backgroundColor: KarrotColors.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: KarrotColors.border, marginHorizontal: 16 },
  body: { padding: 16 },
  title: { fontSize: 20, fontWeight: '600', color: KarrotColors.text, lineHeight: 27 },
  category: { fontSize: 13, color: KarrotColors.subText, marginTop: 6 },
  desc: { fontSize: 16, lineHeight: 24, color: KarrotColors.text, marginTop: 16 },
  stats: { fontSize: 13, color: KarrotColors.lightText, marginTop: 20 },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KarrotColors.border,
    backgroundColor: '#fff',
  },
  likeBtn: {
    paddingRight: 14,
    marginRight: 14,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: KarrotColors.border,
  },
  priceBox: { flex: 1 },
  price: { fontSize: 17, fontWeight: '700', color: KarrotColors.text },
  chatBtn: {
    backgroundColor: KarrotColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  chatText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  chatOutlineBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: KarrotColors.primary,
    marginRight: 8,
  },
  chatOutlineText: { color: KarrotColors.primary, fontSize: 15, fontWeight: '700' },
  buyBtn: {
    backgroundColor: KarrotColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  buyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
