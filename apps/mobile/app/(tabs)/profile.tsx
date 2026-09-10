import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { mode, setMode } = useTheme();

  return (
    <ScrollView className="flex-1 bg-[#F4F7F5] px-5 pt-16 dark:bg-[#0F1714]">
      <Text className="text-3xl font-bold text-[#163B32] dark:text-white">Profile</Text>
      <View className="mt-7 rounded-3xl bg-white p-5 dark:bg-[#18231F]">
        <Text className="text-lg font-bold text-[#163B32] dark:text-white">{profile?.name ?? profile?.full_name ?? 'LIVYA member'}</Text>
        <Text className="mt-1 text-sm text-[#6C817A] dark:text-[#9EB1A9]">{profile?.email ?? 'Account not loaded'}</Text>
      </View>
      <View className="mt-4 rounded-3xl bg-white p-5 dark:bg-[#18231F]">
        <Text className="font-bold text-[#163B32] dark:text-white">Appearance</Text>
        <View className="mt-4 flex-row gap-2">
          {(['light', 'dark', 'system'] as const).map((item) => (
            <Pressable key={item} onPress={() => setMode(item)} className={`rounded-xl px-4 py-3 ${mode === item ? 'bg-[#163B32]' : 'bg-[#EEF3F0] dark:bg-[#101815]'}`}>
              <Text className={`text-sm font-semibold ${mode === item ? 'text-white' : 'text-[#163B32] dark:text-[#DCE9E4]'}`}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Pressable onPress={() => void signOut()} className="mt-4 rounded-2xl border border-[#B9C9C3] p-4 dark:border-[#35443E]">
        <Text className="text-center font-semibold text-[#163B32] dark:text-white">Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}
