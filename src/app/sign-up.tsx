// 회원가입 화면 (이메일)
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthField } from '@/components/auth-field';
import { useAuth } from '@/store/AuthStore';
import { usePoints } from '@/store/PointsStore';
import { KarrotColors, Radius } from '@/theme/karrot';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const { signUp } = useAuth();
  const { redeemReferral } = usePoints();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [invite, setInvite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false); // 인증 메일 발송됨(이메일 확인 필요)

  const emailRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const inviteRef = useRef<TextInput>(null);

  // 초대 링크(prtice://sign-up?ref=CODE)로 들어오면 초대코드 자동 입력
  useEffect(() => {
    if (ref) setInvite(String(ref).toUpperCase());
  }, [ref]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/sign-in'));
  const notify = (msg: string) => (Platform.OS === 'web' ? window.alert(msg) : Alert.alert(msg));

  const onSubmit = async () => {
    setError(null);
    if (name.trim().length < 2) return setError('이름(닉네임)을 2자 이상 입력해주세요.');
    if (!EMAIL_RE.test(email.trim())) return setError('올바른 이메일 형식을 입력해주세요.');
    if (password.length < 6) return setError('비밀번호는 6자 이상이에요.');
    if (password !== confirm) return setError('비밀번호가 일치하지 않아요.');
    setSubmitting(true);
    try {
      const { needsConfirmation } = await signUp(name, email, password);
      if (needsConfirmation) {
        // 이메일 확인이 필요한 설정이면 안내 화면 (초대코드는 확인 후 로그인 시점에 처리 필요)
        setSent(true);
      } else if (invite.trim()) {
        // 자동 로그인 상태 → 초대코드 적용 (추천인·본인 각 1,000P)
        try {
          const r = await redeemReferral(invite.trim());
          if (r.ok) notify('초대코드 적용! 1,000P가 지급됐어요 🎉');
          else if (r.reason === 'invalid_code') notify('초대코드가 올바르지 않아 적용되지 않았어요. (가입은 완료됐어요)');
          else if (r.reason === 'self') notify('본인 초대코드는 사용할 수 없어요. (가입은 완료됐어요)');
          else if (r.reason === 'already_referred') notify('이미 초대코드를 사용한 계정이에요.');
        } catch {
          // 가입은 성공했으니 초대코드 실패는 조용히 무시
        }
      }
      // 세션이 생기면 가드가 자동으로 홈으로 전환합니다.
    } catch (e: any) {
      setError(e?.message ?? '회원가입에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.flex, styles.doneWrap, { paddingTop: insets.top }]}>
        <View style={styles.doneBadge}>
          <Ionicons name="mail-unread-outline" size={56} color={KarrotColors.primary} />
        </View>
        <Text style={styles.doneTitle}>인증 메일을 보냈어요</Text>
        <Text style={styles.doneDesc}>
          {email} 로 보낸 메일의 링크를 눌러{'\n'}인증을 완료한 뒤 로그인해주세요.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, styles.doneBtn, pressed && { backgroundColor: KarrotColors.primaryDark }]}
          onPress={() => router.replace('/sign-in')}
        >
          <Text style={styles.primaryText}>로그인하러 가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={26} color={KarrotColors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>이메일로 회원가입</Text>
        <Text style={styles.subtitle}>몇 가지만 입력하면 바로 시작할 수 있어요</Text>

        <View style={styles.form}>
          <AuthField
            label="이름 (닉네임)"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setError(null);
            }}
            placeholder="당근이"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
          <AuthField
            ref={emailRef}
            label="이메일"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            placeholder="hello@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => pwRef.current?.focus()}
          />
          <AuthField
            ref={pwRef}
            label="비밀번호"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setError(null);
            }}
            placeholder="6자 이상"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <AuthField
            ref={confirmRef}
            label="비밀번호 확인"
            value={confirm}
            onChangeText={(t) => {
              setConfirm(t);
              setError(null);
            }}
            placeholder="비밀번호를 다시 입력하세요"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => inviteRef.current?.focus()}
          />
          <AuthField
            ref={inviteRef}
            label="초대코드 (선택)"
            value={invite}
            onChangeText={(t) => setInvite(t.replace(/\s/g, '').toUpperCase())}
            placeholder="친구 초대코드가 있다면 입력하세요"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />

          {!!error && <Text style={styles.formError}>{error}</Text>}

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              submitting && styles.btnDisabled,
              pressed && !submitting && { backgroundColor: KarrotColors.primaryDark },
            ]}
            disabled={submitting}
            onPress={onSubmit}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>가입하기</Text>}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>이미 계정이 있으신가요?</Text>
          <Pressable onPress={goBack} hitSlop={8}>
            <Text style={styles.footerLink}>로그인</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: KarrotColors.background },
  header: { paddingHorizontal: 12, paddingBottom: 4 },
  headerBack: { width: 26 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: KarrotColors.text },
  subtitle: { fontSize: 14, color: KarrotColors.subText, marginTop: 8 },
  form: { marginTop: 28 },
  formError: { fontSize: 13, color: KarrotColors.danger, marginBottom: 12, marginTop: -4 },
  primaryBtn: {
    height: 52,
    backgroundColor: KarrotColors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnDisabled: { backgroundColor: KarrotColors.lightText },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
  footerText: { fontSize: 14, color: KarrotColors.subText },
  footerLink: { fontSize: 14, color: KarrotColors.primary, fontWeight: '700' },
  doneWrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  doneBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: KarrotColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  doneTitle: { fontSize: 20, fontWeight: '700', color: KarrotColors.text },
  doneDesc: { fontSize: 14, color: KarrotColors.subText, marginTop: 8, textAlign: 'center', lineHeight: 21 },
  doneBtn: { alignSelf: 'stretch', marginTop: 28 },
});
