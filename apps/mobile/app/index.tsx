import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  return (
    <View className="flex-1 bg-[#F4F7F5] items-center justify-center px-6">
      <Text className="text-5xl font-bold tracking-tight text-[#163B32]">LIVYA</Text>
      <Text className="mt-3 text-center text-base text-[#587068]">Your intelligent health companion</Text>
      <Pressable className="mt-10 rounded-2xl bg-[#163B32] px-8 py-4" onPress={() => router.push('/patient')}>
        <Text className="font-semibold text-white">Open Patient App</Text>
      </Pressable>
      <Pressable className="mt-3 rounded-2xl border border-[#B9C9C3] px-8 py-4" onPress={() => router.push('/admin')}>
        <Text className="font-semibold text-[#163B32]">Open Admin</Text>
      </Pressable>
    </View>
  );
}
