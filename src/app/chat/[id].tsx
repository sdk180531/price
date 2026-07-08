import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/store/AppStore';
import { formatPrice } from '@/lib/format';
import { KarrotColors, Radius } from '@/theme/karrot';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getChat, sendMessage, markRead } = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const chat = getChat(id);

  useEffect(() => {
    if (chat && chat.unread > 0) markRead(chat.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat?.id]);

  const data = useMemo(() => (chat ? [...chat.messages].reverse() : []), [chat]);

  if (!chat) {
    return (
      <View style={styles.center}>
        <Text style={{ color: KarrotColors.subText }}>채팅방을 찾을 수 없어요.</Text>
      </View>
    );
  }

  const onSend = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(chat.id, t);
    setText('');
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={KarrotColors.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 4 }}>
          <Text style={styles.headerName}>{chat.peer.name}</Text>
          <Text style={styles.headerLoc}>{chat.peer.location}</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={20} color={KarrotColors.text} />
      </View>

      {/* 상품 요약 */}
      <View style={styles.productBar}>
        <Image source={chat.productImage} style={styles.productImg} contentFit="cover" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {chat.productTitle}
          </Text>
          <Text style={styles.productPrice}>{formatPrice(chat.productPrice)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.tradeBtn, pressed && { backgroundColor: KarrotColors.primaryDark }]}
          onPress={() => router.push({ pathname: '/checkout', params: { id: chat.productId } })}
        >
          <Text style={styles.tradeText}>거래하기</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* 메시지 목록 */}
        <FlatList
          data={data}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.msgRow, item.fromMe ? styles.msgRight : styles.msgLeft]}>
              {!item.fromMe && (
                <Image source={chat.peer.avatar} style={styles.msgAvatar} />
              )}
              <View style={item.fromMe ? styles.rowMine : styles.rowTheirs}>
                {item.fromMe && <Text style={styles.msgTime}>{item.time}</Text>}
                <View style={[styles.bubble, item.fromMe ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.msgText, item.fromMe && { color: '#fff' }]}>{item.text}</Text>
                </View>
                {!item.fromMe && <Text style={styles.msgTime}>{item.time}</Text>}
              </View>
            </View>
          )}
        />

        {/* 입력 바 */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <Pressable hitSlop={8}>
            <Ionicons name="add-circle-outline" size={28} color={KarrotColors.subText} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="메시지 보내기"
            placeholderTextColor={KarrotColors.lightText}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable onPress={onSend} hitSlop={8} disabled={!text.trim()}>
            <Ionicons
              name="arrow-up-circle"
              size={30}
              color={text.trim() ? KarrotColors.primary : KarrotColors.lightText}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KarrotColors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  headerName: { fontSize: 16, fontWeight: '700', color: KarrotColors.text },
  headerLoc: { fontSize: 12, color: KarrotColors.subText, marginTop: 1 },
  productBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: KarrotColors.bgGray,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: KarrotColors.border,
  },
  productImg: { width: 40, height: 40, borderRadius: Radius.sm, backgroundColor: KarrotColors.lightBorder },
  productTitle: { fontSize: 13, color: KarrotColors.text },
  productPrice: { fontSize: 14, fontWeight: '700', color: KarrotColors.text, marginTop: 2 },
  tradeBtn: {
    backgroundColor: KarrotColors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tradeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  msgRow: { flexDirection: 'row', marginBottom: 14, maxWidth: '100%' },
  msgLeft: { justifyContent: 'flex-start' },
  msgRight: { justifyContent: 'flex-end' },
  msgAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: KarrotColors.lightBorder },
  rowMine: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, maxWidth: '80%', justifyContent: 'flex-end' },
  rowTheirs: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, maxWidth: '80%' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMine: { backgroundColor: KarrotColors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: KarrotColors.chip, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 21, color: KarrotColors.text },
  msgTime: { fontSize: 10, color: KarrotColors.lightText, marginBottom: 2 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KarrotColors.border,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
    color: KarrotColors.text,
    backgroundColor: KarrotColors.bgGray,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
});
