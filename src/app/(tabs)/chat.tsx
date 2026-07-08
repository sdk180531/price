import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/store/AppStore';
import { KarrotColors, Radius } from '@/theme/karrot';

export default function ChatListScreen() {
  const { chats } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>아직 채팅이 없어요.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: KarrotColors.bgGray }]}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id } })}
          >
            <Image source={item.peer.avatar} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.topLine}>
                <Text style={styles.name}>{item.peer.name}</Text>
                <Text style={styles.loc}>{item.peer.location}</Text>
                <Text style={styles.time}>· {item.timeAgo}</Text>
              </View>
              <Text style={styles.last} numberOfLines={1}>
                {item.lastMessage || '대화를 시작해보세요'}
              </Text>
            </View>
            <View style={styles.rightWrap}>
              <Image source={item.productImage} style={styles.productThumb} />
              {item.unread > 0 && (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KarrotColors.background },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KarrotColors.border,
  },
  headerTitle: { fontSize: 19, fontWeight: '700', color: KarrotColors.text },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: KarrotColors.lightBorder },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 15, fontWeight: '600', color: KarrotColors.text },
  loc: { fontSize: 12, color: KarrotColors.lightText },
  time: { fontSize: 12, color: KarrotColors.lightText },
  last: { fontSize: 14, color: KarrotColors.subText, marginTop: 4 },
  rightWrap: { position: 'relative' },
  productThumb: { width: 52, height: 52, borderRadius: Radius.md, backgroundColor: KarrotColors.lightBorder },
  unread: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: KarrotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { paddingTop: 80, alignItems: 'center' },
  emptyText: { color: KarrotColors.subText, fontSize: 15 },
});
