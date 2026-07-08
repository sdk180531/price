// 관리자 페이지 (/admin) — 아이디/비밀번호 로그인 후 point_policy(포인트 정책) CRUD.
// 실제 쓰기 권한은 RLS가 아니라 admin_* DB 함수 내부의 자격 증명 검증으로 지켜진다.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { KarrotColors, Radius } from '@/theme/karrot';

type AdminSection = 'menu' | 'point-policy';

interface MenuItem {
  key: AdminSection;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** 유리 아이콘 그라데이션 색상 (밝은 색 → 진한 색) */
  colors: [string, string];
}

// 관리자 홈에 앱 아이콘(글래스) 형태로 뜨는 기능 메뉴. 기능이 늘어나면 여기에 항목만 추가하면 된다.
const MENU_ITEMS: MenuItem[] = [
  { key: 'point-policy', label: '포인트 정책 관리', icon: 'pricetags-outline', colors: ['#FF9D52', '#E55F00'] },
];

interface PointPolicyRow {
  code: string;
  amount: number;
  description: string | null;
  is_active: boolean;
  updated_at: string;
}

interface Credentials {
  username: string;
  password: string;
}

const notify = (msg: string) => (Platform.OS === 'web' ? window.alert(msg) : undefined);
const confirmAction = (msg: string) => (Platform.OS === 'web' ? window.confirm(msg) : true);

// 테이블 컬럼 너비 (헤더/바디/새 행에서 동일하게 사용해 정렬을 맞춘다)
const COL = {
  code: 150,
  amount: 100,
  description: 260,
  active: 90,
  updatedAt: 170,
  actions: 150,
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function AdminScreen() {
  const insets = useSafeAreaInsets();

  const [creds, setCreds] = useState<Credentials | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [section, setSection] = useState<AdminSection>('menu');

  const [policies, setPolicies] = useState<PointPolicyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [newCode, setNewCode] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const loadPolicies = async (c: Credentials) => {
    setLoading(true);
    setActionError(null);
    try {
      const { data, error } = await supabase.rpc('admin_list_point_policy', {
        p_username: c.username,
        p_password: c.password,
      });
      if (error) throw new Error(error.message);
      setPolicies((data ?? []) as PointPolicyRow[]);
    } catch (e: any) {
      setActionError(e?.message ?? '정책을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async () => {
    if (!isSupabaseConfigured) {
      setLoginError('Supabase 설정이 필요해요.');
      return;
    }
    setLoginError(null);
    setLoggingIn(true);
    try {
      const c: Credentials = { username: username.trim(), password };
      const { data, error } = await supabase.rpc('admin_list_point_policy', {
        p_username: c.username,
        p_password: c.password,
      });
      if (error) throw new Error(error.message);
      setCreds(c);
      setPolicies((data ?? []) as PointPolicyRow[]);
    } catch {
      setLoginError('아이디 또는 비밀번호가 올바르지 않아요.');
    } finally {
      setLoggingIn(false);
    }
  };

  const onLogout = () => {
    setCreds(null);
    setUsername('');
    setPassword('');
    setPolicies([]);
    setActionError(null);
    setSection('menu');
  };

  const openSection = (key: AdminSection) => {
    setSection(key);
    if (key === 'point-policy' && creds) loadPolicies(creds);
  };

  const updateField = (code: string, patch: Partial<PointPolicyRow>) => {
    setPolicies((prev) => prev.map((p) => (p.code === code ? { ...p, ...patch } : p)));
  };

  const onSave = async (row: PointPolicyRow) => {
    if (!creds) return;
    setActionError(null);
    try {
      const { error } = await supabase.rpc('admin_upsert_point_policy', {
        p_username: creds.username,
        p_password: creds.password,
        p_code: row.code,
        p_amount: row.amount,
        p_description: row.description,
        p_is_active: row.is_active,
      });
      if (error) throw new Error(error.message);
      notify(`'${row.code}' 저장했어요.`);
      await loadPolicies(creds);
    } catch (e: any) {
      setActionError(e?.message ?? '저장에 실패했어요.');
    }
  };

  const onDelete = async (code: string) => {
    if (!creds) return;
    if (!confirmAction(`'${code}' 정책을 삭제할까요?`)) return;
    setActionError(null);
    try {
      const { error } = await supabase.rpc('admin_delete_point_policy', {
        p_username: creds.username,
        p_password: creds.password,
        p_code: code,
      });
      if (error) throw new Error(error.message);
      await loadPolicies(creds);
    } catch (e: any) {
      setActionError(e?.message ?? '삭제에 실패했어요.');
    }
  };

  const onAdd = async () => {
    if (!creds) return;
    const amountNum = Number(newAmount);
    if (!newCode.trim()) return setActionError('코드를 입력해주세요.');
    if (!Number.isFinite(amountNum) || amountNum < 0) return setActionError('금액은 0 이상의 숫자여야 해요.');
    setActionError(null);
    try {
      const { error } = await supabase.rpc('admin_upsert_point_policy', {
        p_username: creds.username,
        p_password: creds.password,
        p_code: newCode.trim(),
        p_amount: amountNum,
        p_description: newDescription.trim() || null,
        p_is_active: true,
      });
      if (error) throw new Error(error.message);
      setNewCode('');
      setNewAmount('');
      setNewDescription('');
      await loadPolicies(creds);
    } catch (e: any) {
      setActionError(e?.message ?? '추가에 실패했어요.');
    }
  };

  if (!creds) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.title}>관리자 로그인</Text>
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>아이디</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="admin"
            placeholderTextColor={KarrotColors.lightText}
          />
          <Text style={styles.fieldLabel}>비밀번호</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="비밀번호"
            placeholderTextColor={KarrotColors.lightText}
            onSubmitEditing={onLogin}
          />
          {!!loginError && <Text style={styles.error}>{loginError}</Text>}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { backgroundColor: KarrotColors.primaryDark }]}
            onPress={onLogin}
            disabled={loggingIn}
          >
            {loggingIn ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>로그인</Text>}
          </Pressable>
        </View>
      </View>
    );
  }

  if (section === 'menu') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>관리자</Text>
          <Pressable onPress={onLogout} hitSlop={8}>
            <Text style={styles.logout}>로그아웃</Text>
          </Pressable>
        </View>

        <View style={styles.menuGrid}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.menuTile, pressed && { transform: [{ scale: 0.94 }] }]}
              onPress={() => openSection(item.key)}
            >
              <View style={styles.menuIconOuter}>
                <LinearGradient
                  colors={item.colors}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['rgba(255,255,255,0.65)', 'rgba(255,255,255,0)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.9 }}
                  style={styles.menuIconGloss}
                />
                <Ionicons name={item.icon} size={26} color="#fff" style={styles.menuIconGlyph} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Pressable style={styles.backRow} onPress={() => setSection('menu')} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={KarrotColors.text} />
        <Text style={styles.backText}>관리자 홈</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={styles.title}>포인트 정책 관리</Text>
      </View>

      {loading && <ActivityIndicator color={KarrotColors.primary} style={{ marginVertical: 12 }} />}
      {!!actionError && <Text style={styles.error}>{actionError}</Text>}

      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.tableScroll}>
        <View>
          {/* 헤더 */}
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, { width: COL.code }]}>code</Text>
            <Text style={[styles.th, { width: COL.amount }]}>amount</Text>
            <Text style={[styles.th, { width: COL.description }]}>description</Text>
            <Text style={[styles.th, { width: COL.active }]}>is_active</Text>
            <Text style={[styles.th, { width: COL.updatedAt }]}>updated_at</Text>
            <Text style={[styles.th, { width: COL.actions }]}>관리</Text>
          </View>

          {/* 데이터 행 */}
          {policies.map((row) => (
            <View key={row.code} style={styles.tr}>
              <Text style={[styles.td, styles.tdCode, { width: COL.code }]}>{row.code}</Text>
              <TextInput
                style={[styles.tdInput, { width: COL.amount }]}
                keyboardType="numeric"
                value={String(row.amount)}
                onChangeText={(t) => updateField(row.code, { amount: Number(t.replace(/[^0-9]/g, '')) || 0 })}
              />
              <TextInput
                style={[styles.tdInput, { width: COL.description }]}
                value={row.description ?? ''}
                onChangeText={(t) => updateField(row.code, { description: t })}
              />
              <View style={[styles.tdCenter, { width: COL.active }]}>
                <Switch
                  value={row.is_active}
                  onValueChange={(v) => updateField(row.code, { is_active: v })}
                  trackColor={{ true: KarrotColors.primary, false: KarrotColors.lightBorder }}
                />
              </View>
              <Text style={[styles.td, styles.tdMuted, { width: COL.updatedAt }]}>
                {formatDateTime(row.updated_at)}
              </Text>
              <View style={[styles.tdActions, { width: COL.actions }]}>
                <Pressable style={styles.saveBtn} onPress={() => onSave(row)}>
                  <Text style={styles.saveText}>저장</Text>
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={() => onDelete(row.code)}>
                  <Text style={styles.deleteText}>삭제</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {/* 새 정책 추가 행 */}
          <View style={[styles.tr, styles.trNew]}>
            <TextInput
              style={[styles.tdInput, { width: COL.code }]}
              placeholder="새 코드"
              placeholderTextColor={KarrotColors.lightText}
              value={newCode}
              onChangeText={setNewCode}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.tdInput, { width: COL.amount }]}
              placeholder="금액"
              placeholderTextColor={KarrotColors.lightText}
              keyboardType="numeric"
              value={newAmount}
              onChangeText={(t) => setNewAmount(t.replace(/[^0-9]/g, ''))}
            />
            <TextInput
              style={[styles.tdInput, { width: COL.description }]}
              placeholder="설명"
              placeholderTextColor={KarrotColors.lightText}
              value={newDescription}
              onChangeText={setNewDescription}
            />
            <View style={[styles.tdCenter, { width: COL.active }]}>
              <Text style={styles.tdMuted}>true</Text>
            </View>
            <Text style={[styles.td, styles.tdMuted, { width: COL.updatedAt }]}>-</Text>
            <View style={[styles.tdActions, { width: COL.actions }]}>
              <Pressable style={styles.saveBtn} onPress={onAdd}>
                <Text style={styles.saveText}>추가</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: KarrotColors.background, paddingHorizontal: 20 },
  title: { fontSize: 22, fontWeight: '800', color: KarrotColors.text },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  logout: { color: KarrotColors.danger, fontWeight: '600' },
  form: { marginTop: 24 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: KarrotColors.subText, marginTop: 12, marginBottom: 6 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: KarrotColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    color: KarrotColors.text,
    backgroundColor: KarrotColors.bgGray,
  },
  error: { fontSize: 13, color: KarrotColors.danger, marginTop: 8 },
  primaryBtn: {
    height: 52,
    backgroundColor: KarrotColors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 22 },
  menuTile: { width: 84, alignItems: 'center' },
  menuIconOuter: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    backgroundColor: KarrotColors.bgGray,
    boxShadow:
      '0 10px 18px rgba(229,95,0,0.28), inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -10px 14px rgba(0,0,0,0.12)',
  } as any,
  menuIconGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  menuIconGlyph: {
    textShadow: '0 1px 2px rgba(0,0,0,0.25)',
  } as any,
  menuLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: KarrotColors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 12 },
  backText: { fontSize: 15, fontWeight: '600', color: KarrotColors.text },

  tableScroll: {
    borderWidth: 1,
    borderColor: KarrotColors.border,
    borderRadius: Radius.md,
  },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: KarrotColors.border,
  },
  thead: { backgroundColor: KarrotColors.bgGray },
  trNew: { backgroundColor: KarrotColors.primarySoft },
  th: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '700',
    color: KarrotColors.subText,
  },
  td: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: KarrotColors.text,
  },
  tdCode: { fontWeight: '700' },
  tdMuted: { fontSize: 12, color: KarrotColors.subText },
  tdInput: {
    height: 44,
    marginHorizontal: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: KarrotColors.border,
    borderRadius: Radius.sm,
    fontSize: 14,
    color: KarrotColors.text,
    backgroundColor: '#fff',
  },
  tdCenter: { alignItems: 'center', justifyContent: 'center' },
  tdActions: { flexDirection: 'row', gap: 6, paddingHorizontal: 8 },
  saveBtn: {
    flex: 1,
    backgroundColor: KarrotColors.primary,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: KarrotColors.danger,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  deleteText: { color: KarrotColors.danger, fontWeight: '700', fontSize: 13 },
});
