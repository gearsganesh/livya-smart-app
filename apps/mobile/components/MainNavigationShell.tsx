import { Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useTheme } from '../lib/theme';

const tabs = [
  { name: 'home', title: 'Home', icon: '⌂' },
  { name: 'health', title: 'Health', icon: '♡' },
  { name: 'care', title: 'Care', icon: '✦' },
  { name: 'store', title: 'Store', icon: '▣' },
  { name: 'profile', title: 'Profile', icon: '◯' },
] as const;

export function MainNavigationShell() {
  const { isOnline, pendingMutations } = useOfflineSync();
  const { mode, toggleMode } = useTheme();

  return (
    <View className="flex-1 bg-[#F4F7F5] dark:bg-[#0F1714]">
      <View className="absolute left-0 right-0 top-0 z-20 flex-row items-center justify-between px-5 pt-2">
        <View className="rounded-full bg-white/90 px-3 py-1.5 dark:bg-[#1A2521]/95">
          <Text className="text-xs font-semibold text-[#587068] dark:text-[#B8CAC2]">
            {isOnline ? (pendingMutations ? `Syncing ${pendingMutations}` : 'Online') : 'Offline · saved locally'}
          </Text>
        </View>
        <Pressable onPress={toggleMode} accessibilityRole="button" accessibilityLabel="Toggle theme">
          <Text className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#163B32] dark:bg-[#1A2521] dark:text-[#DCE9E4]">
            {mode === 'dark' ? 'Light' : 'Dark'}
          </Text>
        </Pressable>
      </View>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#163B32',
          tabBarInactiveTintColor: '#7A8B85',
          tabBarStyle: {
            height: 76,
            paddingTop: 8,
            paddingBottom: 12,
            borderTopWidth: 0,
            backgroundColor: '#FFFFFF',
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, focused }) => (
                <Text style={{ color, fontSize: focused ? 22 : 20, lineHeight: 24 }}>{tab.icon}</Text>
              ),
            }}
          />
        ))}
      </Tabs>
    </View>
  );
}
