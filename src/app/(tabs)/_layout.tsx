import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useApp } from '@/store/AppStore';
import { KarrotColors } from '@/theme/karrot';

export default function TabsLayout() {
  const { totalUnread } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: KarrotColors.text,
        tabBarInactiveTintColor: KarrotColors.lightText,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
        tabBarStyle: {
          borderTopColor: KarrotColors.lightBorder,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: '동네생활',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="reader-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="near"
        options={{
          title: '내 근처',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: '채팅',
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: KarrotColors.primary, fontSize: 10 },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: '나의 당근',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
