import { View, Text, ScrollView } from 'react-native';

const metrics = [
  ['Active members', '1,284'],
  ['Vital alerts', '7'],
  ['AI review queue', '12'],
  ['Bookings today', '48']
];

export default function AdminHome() {
  return (
    <ScrollView className="flex-1 bg-[#F7F8F7] px-6 pt-16">
      <Text className="text-sm font-semibold tracking-widest text-[#6C817A]">LIVYA ADMIN</Text>
      <Text className="mt-2 text-3xl font-bold text-[#163B32]">Clinical command centre</Text>
      <View className="mt-8 gap-3">
        {metrics.map(([label, value]) => (
          <View key={label} className="rounded-3xl bg-white p-5">
            <Text className="text-sm text-[#6C817A]">{label}</Text>
            <Text className="mt-1 text-3xl font-bold text-[#163B32]">{value}</Text>
          </View>
        ))}
      </View>
      <View className="mt-5 mb-10 rounded-3xl border border-[#D6E0DC] bg-white p-5">
        <Text className="font-bold text-[#163B32]">Priority queue</Text>
        <Text className="mt-2 text-[#587068]">Vital alerts and AI-assisted record reviews will appear here.</Text>
      </View>
    </ScrollView>
  );
}
