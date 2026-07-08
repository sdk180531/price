// 친구 초대 화면 — 내 초대코드/링크 공유. 지급액은 point_policy 테이블 정책을 따른다.
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoints } from '@/store/PointsStore';
import { KarrotColors, Radius } from '@/theme/karrot';

export default function ReferralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getReferralCode, pointPolicy } = usePoints();
  const { signupBonus, referralReward } = pointPolicy;
  const sameReward = signupBonus === referralReward;

  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReferralCode()
      .then(setCode)
      .catch((e: any) => setError(e?.message ?? '초대코드를 불러오지 못했어요.'));
  }, [getReferralCode]);

  // 현재 실행 환경에 맞는 딥링크 생성 (Expo Go: exp://, 빌드 앱: prtice://)
  const link = code ? Linking.createURL('/sign-up', { queryParams: { ref: code } }) : '';
  const rewardText = sameReward
    ? `친구도 나도 각각 ${signupBonus.toLocaleString('ko-KR')}P를 받아요`
    : `친구는 ${signupBonus.toLocaleString('ko-KR')}P, 나는 ${referralReward.toLocaleString('ko-KR')}P를 받아요`;
  const message = code ? `🥕 당근마켓 초대!\n초대코드 [${code}] 로 가입하면 ${rewardText}.\n${link}` : '';

  const notify = (msg: string) => (Platform.OS === 'web' ? window.alert(msg) : undefined);

  const onCopyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    notify('초대코드가 복사됐어요.');
  };

  const onShare = async () => {
    if (!message) return;
    try {
      if (Platform.OS === 'web') {
        // @ts-ignore - navigator.share (지원 브라우저)
        if (typeof navigator !== 'undefined' && navigator.share) {
          // @ts-ignore
          await navigator.share({ text: message });
        } else {
          await Clipboard.setStringAsync(message);
          window.alert('초대 메시지가 복사됐어요. 친구에게 붙여넣기 해서 보내세요!');
        }
      } else {
        await Share.share({ message });
      }
    } catch {
      // 사용자가 공유를 취소한 경우 등 무시
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={26} color={KarrotColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>친구 초대</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Ionicons name="gift" size={48} color={KarrotColors.primary} />
          <Text style={styles.heroTitle}>
            친구 초대하고{'\n'}
            {sameReward ? `둘 다 ${signupBonus.toLocaleString('ko-KR')}P 받기` : '포인트 받기'}
          </Text>
          <Text style={styles.heroDesc}>
            친구가 아래 초대코드로 가입하면{'\n'}
            <Text style={{ fontWeight: '700', color: KarrotColors.primary }}>{rewardText}</Text>.
          </Text>
        </View>

        {/* 초대코드 */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>내 초대코드</Text>
          {code ? (
            <Text style={styles.codeValue}>{code}</Text>
          ) : error ? (
            <Text style={styles.codeError}>{error}</Text>
          ) : (
            <ActivityIndicator color={KarrotColors.primary} style={{ marginVertical: 8 }} />
          )}
          <Pressable
            style={({ pressed }) => [styles.copyBtn, pressed && { backgroundColor: KarrotColors.primarySoft }]}
            onPress={onCopyCode}
            disabled={!code}
          >
            <Ionicons name="copy-outline" size={16} color={KarrotColors.primary} />
            <Text style={styles.copyText}>코드 복사</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.shareBtn,
            !code && styles.shareBtnDisabled,
            pressed && code && { backgroundColor: KarrotColors.primaryDark },
          ]}
          onPress={onShare}
          disabled={!code}
        >
          <Ionicons name="share-social-outline" size={18} color="#fff" />
          <Text style={styles.shareText}>초대 링크 공유하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KarrotColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KarrotColors.border,
  },
  headerBack: { width: 26 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: KarrotColors.text },
  content: { padding: 24, gap: 24 },
  hero: { alignItems: 'center', gap: 12, marginTop: 12 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: KarrotColors.text, textAlign: 'center', lineHeight: 32 },
  heroDesc: { fontSize: 15, color: KarrotColors.subText, textAlign: 'center', lineHeight: 23 },
  codeCard: {
    backgroundColor: KarrotColors.primarySoft,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  codeLabel: { fontSize: 14, color: KarrotColors.subText },
  codeValue: { fontSize: 34, fontWeight: '800', color: KarrotColors.primary, letterSpacing: 4 },
  codeError: { fontSize: 14, color: KarrotColors.danger, textAlign: 'center' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: KarrotColors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  copyText: { color: KarrotColors.primary, fontWeight: '700', fontSize: 13 },
  bottom: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: KarrotColors.border,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: KarrotColors.primary,
    borderRadius: Radius.md,
    paddingVertical: 15,
  },
  shareBtnDisabled: { backgroundColor: KarrotColors.lightText },
  shareText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
