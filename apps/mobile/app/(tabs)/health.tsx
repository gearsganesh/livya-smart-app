import { ScrollView, Text, View } from 'react-native';

const items = [
  ['Health monitoring', 'Vitals, trends and wearable data'],
  ['Medicines', 'Schedule, adherence and reminders'],
  ['Records', 'Reports, prescriptions and documents'],
  ['Hydration', 'Daily water target and progress'],
];

export default function HealthScreen() {
  return (
    <ScrollView className="flex-1 bg-[#F4F7F5] px-5 pt-16 dark:bg-[#0F1714]">
      <Text className="text-3xl font-bold text-[#163B32] dark:text-white">Health</Text>
      <Text className="mt-1 text-base text-[#587068] dark:text-[#AEBDB7]">Your measurements, records and routines.</Text>
      <View className="mt-7 gap-3">
        {items.map(([title, subtitle]) => (
          <View key={title} className="rounded-3xl bg-white p-5 dark:bg-[#18231F]">
            <Text className="text-lg font-bold text-[#163B32] dark:text-white">{title}</Text>
            <Text className="mt-1 text-sm text-[#6C817A] dark:text-[#9EB1A9]">{subtitle}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
