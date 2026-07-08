// 비밀번호 재설정 — Supabase 이메일 인증번호(OTP)
// 흐름: 이메일 입력 → (실제) 인증번호 메일 발송 → 인증번호+새 비밀번호 → 변경(자동 로그인)
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
import { KarrotColors, Radius } from '@/theme/karrot';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'reset';

export default function FindPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sendResetCode, resetPasswordWithCode } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pwRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/sign-in'));
  const notify = (msg: string) => (Platform.OS === 'web' ? window.alert(msg) : Alert.alert(msg));

  // 1) 인증번호 메일 발송
  const sendCode = async () => {
    setError(null);
    if (!EMAIL_RE.test(email.trim())) return setError('올바른 이메일 형식을 입력해주세요.');
    setBusy(true);
    try {
      await sendResetCode(email);
      setStep('reset');
    } catch (e: any) {
      setError(e?.message ?? '인증번호 발송에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setBusy(true);
    try {
      await sendResetCode(email);
      notify('인증번호를 다시 보냈어요.');
    } catch (e: any) {
      setError(e?.message ?? '재발송에 실패했어요.');
    } finally {
      setBusy(false);
    }
  };

  // 2) 인증번호 확인 + 새 비밀번호 변경
  const submitReset = async () => {
    setError(null);
    if (code.trim().length < 6) return setError('이메일로 받은 인증번호를 입력해주세요.');
    if (password.length < 6) return setError('새 비밀번호는 6자 이상이에요.');
    if (password !== confirm) return setError('비밀번호가 일치하지 않아요.');
    setBusy(true);
    try {
      await resetPasswordWithCode(email, code, password);
      // 성공하면 세션이 생겨 자동 로그인되고, 가드가 홈으로 이동시킵니다.
      notify('비밀번호가 변경되어 자동 로그인됐어요.');
    } catch (e: any) {
      setError(e?.message ?? '비밀번호 재설정에 실패했어요.');
      setBusy(false);
    }
  };

  const info =
    step === 'email'
      ? { title: '비밀번호 재설정', sub: '가입한 이메일로 인증번호를 보내드려요' }
      : { title: '인증번호 입력', sub: `${email} 로 보낸 인증번호와\n새 비밀번호를 입력하세요` };

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
        <Text style={styles.title}>{info.title}</Text>
        <Text style={styles.subtitle}>{info.sub}</Text>

        <View style={styles.form}>
          {step === 'email' && (
            <>
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
                returnKeyType="send"
                onSubmitEditing={sendCode}
              />
              {!!error && <Text style={styles.formError}>{error}</Text>}
              <PrimaryButton label="인증번호 받기" busy={busy} onPress={sendCode} />
            </>
          )}

          {step === 'reset' && (
            <>
              <AuthField
                label="인증번호"
                value={code}
                onChangeText={(t) => {
                  // OTP 길이는 프로젝트 설정에 따라 6~8자리 등으로 다를 수 있어 넉넉히 허용
                  setCode(t.replace(/[^0-9]/g, '').slice(0, 10));
                  setError(null);
                }}
                placeholder="이메일로 받은 인증번호"
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="next"
                onSubmitEditing={() => pwRef.current?.focus()}
              />
              <View style={styles.resendRow}>
                <Text style={styles.resendHint}>메일이 안 왔나요? 스팸함도 확인해보세요.</Text>
                <Pressable onPress={resend} hitSlop={8} disabled={busy}>
                  <Text style={styles.resendLink}>재발송</Text>
                </Pressable>
              </View>

              <AuthField
                ref={pwRef}
                label="새 비밀번호"
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
                label="새 비밀번호 확인"
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
                returnKeyType="done"
                onSubmitEditing={submitReset}
              />
              {!!error && <Text style={styles.formError}>{error}</Text>}
              <PrimaryButton label="비밀번호 변경" busy={busy} onPress={submitReset} />
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>비밀번호가 기억나셨나요?</Text>
          <Pressable onPress={goBack} hitSlop={8}>
            <Text style={styles.footerLink}>로그인</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PrimaryButton({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryBtn,
        busy && styles.btnDisabled,
        pressed && !busy && { backgroundColor: KarrotColors.primaryDark },
      ]}
      disabled={busy}
      onPress={onPress}
    >
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: KarrotColors.background },
  header: { paddingHorizontal: 12, paddingBottom: 4 },
  headerBack: { width: 26 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: KarrotColors.text },
  subtitle: { fontSize: 14, color: KarrotColors.subText, marginTop: 8, lineHeight: 21 },
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
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 16,
  },
  resendHint: { flex: 1, fontSize: 12, color: KarrotColors.lightText },
  resendLink: { fontSize: 13, color: KarrotColors.primary, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24 },
  footerText: { fontSize: 14, color: KarrotColors.subText },
  footerLink: { fontSize: 14, color: KarrotColors.primary, fontWeight: '700' },
});
