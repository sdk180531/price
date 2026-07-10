import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/store/AppStore';
import { AuthProvider, useAuth } from '@/store/AuthStore';
import { PointsProvider } from '@/store/PointsStore';
import { KarrotColors } from '@/theme/karrot';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <PointsProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </PointsProvider>
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();

  // 저장된 세션을 복원하는 동안 잠깐 로딩 표시 (로그인/홈 깜빡임 방지)
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color={KarrotColors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}
    >
      {/* 로그인한 사용자만 접근 가능 */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="payment/success" />
        <Stack.Screen name="payment/fail" />
        <Stack.Screen name="referral" />
      </Stack.Protected>

      {/* 로그아웃 상태에서만 접근 가능 */}
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="find-password" />
      </Stack.Protected>

      {/* 관리자 페이지 — 앱 로그인과 무관하게 /admin 으로 직접 접근(자체 로그인).
          단, 로그아웃 시 '첫 착지 화면'이 되지 않도록 반드시 가드 밖 '맨 뒤'에 선언한다. */}
      <Stack.Screen name="admin" />
    </Stack>
  );
}
