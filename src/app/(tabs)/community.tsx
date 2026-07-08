import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KarrotColors, Radius } from '@/theme/karrot';

const CATEGORIES = ['전체', '동네질문', '동네맛집', '일상', '분실/실종', '동네친구', '취미'];

interface Post {
  id: string;
  category: string;
  content: string;
  location: string;
  timeAgo: string;
  comments: number;
  likes: number;
}

const POSTS: Post[] = [
  {
    id: '1',
    category: '동네질문',
    content: '역삼동 근처에 맛있는 순댓국집 추천해주세요! 이사온 지 얼마 안 돼서요 🙏',
    location: '역삼동',
    timeAgo: '10분 전',
    comments: 12,
    likes: 5,
  },
  {
    id: '2',
    category: '동네맛집',
    content: '삼성동 골목에 새로 생긴 카페 다녀왔어요. 라떼가 정말 맛있네요 ☕️ 사진 첨부합니다.',
    location: '삼성동',
    timeAgo: '32분 전',
    comments: 8,
    likes: 24,
  },
  {
    id: '3',
    category: '분실/실종',
    content: '어제 저녁 대치동 공원에서 갈색 푸들 강아지 봤어요. 목줄 없이 혼자 다니던데 주인 찾습니다.',
    location: '대치동',
    timeAgo: '1시간 전',
    comments: 31,
    likes: 47,
  },
  {
    id: '4',
    category: '일상',
    content: '오늘 날씨 너무 좋네요! 다들 좋은 하루 보내세요 🌤️',
    location: '논현동',
    timeAgo: '2시간 전',
    comments: 3,
    likes: 15,
  },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.headerTitle}>동네생활</Text>
        <Ionicons name="search-outline" size={25} color={KarrotColors.text} />
      </View>

      <FlatList
        data={POSTS}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <View style={styles.chipsRow}>
            {CATEGORIES.map((c, i) => (
              <View key={c} style={[styles.chip, i === 0 && styles.chipActive]}>
                <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{c}</Text>
              </View>
            ))}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.post}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.category}</Text>
            </View>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.meta}>
              {item.location} · {item.timeAgo}
            </Text>
            <View style={styles.actions}>
              <View style={styles.actionItem}>
                <Ionicons name="chatbubble-outline" size={16} color={KarrotColors.subText} />
                <Text style={styles.actionText}>댓글 {item.comments}</Text>
              </View>
              <View style={styles.actionItem}>
                <Ionicons name="heart-outline" size={16} color={KarrotColors.subText} />
                <Text style={styles.actionText}>공감 {item.likes}</Text>
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 19, fontWeight: '700', color: KarrotColors.text },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  chip: {
    borderWidth: 1,
    borderColor: KarrotColors.border,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: KarrotColors.text, borderColor: KarrotColors.text },
  chipText: { fontSize: 13, color: KarrotColors.subText },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  post: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 8,
    borderTopColor: KarrotColors.bgGray,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: KarrotColors.primarySoft,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
  },
  badgeText: { fontSize: 12, color: KarrotColors.primary, fontWeight: '600' },
  content: { fontSize: 15, lineHeight: 22, color: KarrotColors.text },
  meta: { fontSize: 12, color: KarrotColors.lightText, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 12 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, color: KarrotColors.subText },
});
