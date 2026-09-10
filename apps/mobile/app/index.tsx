import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F4F7F5] px-6 dark:bg-[#0F1714]">
      <Text className="text-5xl font-bold tracking-tight text-[#163B32] dark:text-white">LIVYA</Text>
      <Text className="mt-3 text-center text-base text-[#587068] dark:text-[#AEBDB7]">Your intelligent health companion</Text>
      <Pressable className="mt-10 rounded-2xl bg-[#163B32] px-8 py-4" onPress={() => router.replace('/(tabs)/home')}>
        <Text className="font-semibold text-white">Open Patient App</Text>
      </Pressable>
      <Pressable className="mt-3 rounded-2xl border border-[#B9C9C3] px-8 py-4 dark:border-[#35443E]" onPress={() => router.push('/admin')}>
        <Text className="font-semibold text-[#163B32] dark:text-white">Open Admin</Text>
      </Pressable>
    </View>
  );
}
