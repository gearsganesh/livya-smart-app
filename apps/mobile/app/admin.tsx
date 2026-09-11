import { ScrollView, Text, View } from 'react-native';

export default function AdminHome() {
  return <ScrollView className="flex-1 bg-[#F4F7F5] px-5 pt-16 dark:bg-[#0F1714]"><Text className="text-sm font-semibold tracking-widest text-[#6C817A] dark:text-[#9EB1A9]">LIVYA ADMIN</Text><Text className="mt-2 text-3xl font-bold text-[#163B32] dark:text-white">Operations</Text><View className="mt-8 rounded-3xl bg-white p-6 dark:bg-[#18231F]"><Text className="text-lg font-bold text-[#163B32] dark:text-white">No operational data yet</Text><Text className="mt-2 leading-6 text-[#587068] dark:text-[#AEBDB7]">Patient, alert, record and booking metrics will appear here from live Supabase data.</Text></View></ScrollView>;
}
