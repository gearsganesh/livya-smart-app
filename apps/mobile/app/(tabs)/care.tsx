import { ScrollView, Text, View } from 'react-native';

export default function CareScreen() {
  return (
    <ScrollView className="flex-1 bg-[#F4F7F5] px-5 pt-16 dark:bg-[#0F1714]">
      <Text className="text-3xl font-bold text-[#163B32] dark:text-white">Care</Text>
      <Text className="mt-1 text-base text-[#587068] dark:text-[#AEBDB7]">Programs, nutrition, therapy and AI guidance.</Text>
      <View className="mt-7 gap-3">
        {['AI health chat', 'Nutrition & programmes', 'Therapy booking', 'Lab tests'].map((title) => (
          <View key={title} className="rounded-3xl bg-white p-5 dark:bg-[#18231F]">
            <Text className="text-lg font-bold text-[#163B32] dark:text-white">{title}</Text>
            <Text className="mt-1 text-sm text-[#6C817A] dark:text-[#9EB1A9]">Personalised care tools from the LIVYA prototype.</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
