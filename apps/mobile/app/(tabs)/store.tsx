import { ScrollView, Text, View } from 'react-native';

export default function StoreScreen() {
  return (
    <ScrollView className="flex-1 bg-[#F4F7F5] px-5 pt-16 dark:bg-[#0F1714]">
      <Text className="text-3xl font-bold text-[#163B32] dark:text-white">Store</Text>
      <Text className="mt-1 text-base text-[#587068] dark:text-[#AEBDB7]">Wellness products, tests and subscriptions.</Text>
      <View className="mt-7 rounded-3xl bg-[#163B32] p-6">
        <Text className="text-lg font-bold text-white">Your cart</Text>
        <Text className="mt-2 text-[#D8E6E0]">No items yet. The catalogue will plug into the offline cache as products are connected.</Text>
      </View>
    </ScrollView>
  );
}
