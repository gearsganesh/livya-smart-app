import { View, Text, ScrollView } from 'react-native';

const cards = [
  ['Health Score', '78'],
  ['Medicines', '3 / 3'],
  ['Recovery', '81'],
  ['Hydration', '1.2 / 2.5 L']
];

export default function PatientHome() {
  return (
    <ScrollView className="flex-1 bg-[#F4F7F5] px-5 pt-16">
      <Text className="text-sm font-semibold tracking-widest text-[#6C817A]">LIVYA AI</Text>
      <Text className="mt-2 text-3xl font-bold text-[#163B32]">Good morning</Text>
      <Text className="mt-1 text-base text-[#587068]">Your health at a glance</Text>
      <View className="mt-8 flex-row flex-wrap justify-between">
        {cards.map(([label, value]) => (
          <View key={label} className="mb-4 w-[48%] rounded-3xl bg-white p-5 shadow-sm">
            <Text className="text-sm text-[#6C817A]">{label}</Text>
            <Text className="mt-2 text-2xl font-bold text-[#163B32]">{value}</Text>
          </View>
        ))}
      </View>
      <View className="mb-10 rounded-3xl bg-[#163B32] p-6">
        <Text className="text-lg font-bold text-white">Today's plan</Text>
        <Text className="mt-2 leading-6 text-[#D8E6E0]">Keep your medicines on schedule, stay hydrated, and review your health trends.</Text>
      </View>
    </ScrollView>
  );
}
