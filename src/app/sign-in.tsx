// 로그인 화면 (이메일)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { KarrotColors, Radius } from '@/theme/karrot';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pwRef = useRef<TextInput>(null);

  const onSubmit = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError('올바른 이메일 형식을 입력해주세요.');
    if (password.length < 6) return setError('비밀번호는 6자 이상이에요.');
    setSubmitting(true);
    try {
      await signIn(email, password);
      // 성공하면 Stack.Protected 가드가 자동으로 홈으로 전환합니다.
    } catch (e: any) {
      setError(e?.message ?? '로그인에 실패했어요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>당근마켓</Text>
        <Text style={styles.subtitle}>이메일로 로그인하고{'\n'}우리 동네 중고거래를 시작하세요</Text>

        {!configured && (
          <View style={styles.setupBanner}>
            <Ionicons name="warning-outline" size={18} color={KarrotColors.primary} />
            <Text style={styles.setupText}>
              Supabase 설정이 필요해요. .env 에 EXPO_PUBLIC_SUPABASE_URL / ANON_KEY 를 넣고 앱을 새로고침하세요.
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <AuthField
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
            autoComplete="current-password"
            textContentType="password"
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
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>로그인</Text>}
          </Pressable>

          {/* 비밀번호 찾기 */}
          <View style={styles.findRow}>
            <Pressable onPress={() => router.push('/find-password')} hitSlop={8}>
              <Text style={styles.findLink}>비밀번호를 잊으셨나요?</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>아직 회원이 아니신가요?</Text>
          <Pressable onPress={() => router.push('/sign-up')} hitSlop={8}>
            <Text style={styles.footerLink}>회원가입</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: KarrotColors.background },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  brand: { fontSize: 34, fontWeight: '800', color: KarrotColors.primary },
  subtitle: { fontSize: 15, color: KarrotColors.subText, marginTop: 12, lineHeight: 22 },
  form: { marginTop: 36 },
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
  findRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginTop: 20 },
  findLink: { fontSize: 14, color: KarrotColors.subText, fontWeight: '500' },
  setupBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: KarrotColors.primarySoft,
    borderRadius: Radius.md,
    padding: 14,
    marginTop: 20,
  },
  setupText: { flex: 1, fontSize: 12.5, color: KarrotColors.subText, lineHeight: 19 },
});
