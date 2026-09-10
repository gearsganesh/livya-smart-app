import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { useSubmitData } from '../../hooks/useSubmitData';
import { useOfflineSync } from '../../hooks/useOfflineSync';

type Dashboard = {
  healthScore: number;
  hydrationMl: number;
  mood: number;
  focus: number;
  note?: string;
};

const initialDashboard: Dashboard = { healthScore: 78, hydrationMl: 1200, mood: 7, focus: 7 };

export default function HomeScreen() {
  const [note, setNote] = useState('');
  const { isOnline } = useOfflineSync();
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiFetch<Dashboard>('/dashboard'),
    placeholderData: initialDashboard,
  });

  const submitCheckIn = useSubmitData<Dashboard, { note: string }>({
    path: '/check-ins',
    queryKey: ['dashboard'],
    optimisticUpdate: (current, variables) => ({
      ...(current ?? initialDashboard),
      note: variables.note,
    }),
  });

  const submit = () => {
    const value = note.trim();
    if (!value) return;
    submitCheckIn.submit({ note: value });
    setNote('');
  };

  const data = dashboard.data ?? initialDashboard;

  return (
    <ScrollView className="flex-1 bg-[#F4F7F5] px-5 pb-10 pt-16 dark:bg-[#0F1714]" contentContainerStyle={{ paddingBottom: 24 }}>
      <Text className="text-sm font-semibold tracking-widest text-[#6C817A] dark:text-[#9EB1A9]">LIVYA AI</Text>
      <Text className="mt-2 text-3xl font-bold text-[#163B32] dark:text-white">Good morning</Text>
      <Text className="mt-1 text-base text-[#587068] dark:text-[#AEBDB7]">Your health at a glance</Text>

      <View className="mt-8 flex-row flex-wrap justify-between">
        {[
          ['Health Score', String(data.healthScore)],
          ['Hydration', `${(data.hydrationMl / 1000).toFixed(1)} L`],
          ['Mood', `${data.mood}/10`],
          ['Focus', `${data.focus}/10`],
        ].map(([label, value]) => (
          <View key={label} className="mb-4 w-[48%] rounded-3xl bg-white p-5 dark:bg-[#18231F]">
            <Text className="text-sm text-[#6C817A] dark:text-[#9EB1A9]">{label}</Text>
            <Text className="mt-2 text-2xl font-bold text-[#163B32] dark:text-white">{value}</Text>
          </View>
        ))}
      </View>

      <View className="rounded-3xl bg-[#163B32] p-6">
        <Text className="text-lg font-bold text-white">Today's plan</Text>
        <Text className="mt-2 leading-6 text-[#D8E6E0]">Keep medicines on schedule, stay hydrated, and review your health trends.</Text>
      </View>

      <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-[#18231F]">
        <Text className="text-lg font-bold text-[#163B32] dark:text-white">Quick check-in</Text>
        <Text className="mt-1 text-sm text-[#6C817A] dark:text-[#9EB1A9]">Your entry appears immediately, even without a connection.</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="How are you feeling today?"
          placeholderTextColor="#8B9B95"
          multiline
          className="mt-4 min-h-24 rounded-2xl bg-[#F4F7F5] px-4 py-3 text-[#163B32] dark:bg-[#101815] dark:text-white"
        />
        <Pressable
          disabled={!note.trim() || submitCheckIn.isPending}
          onPress={submit}
          className="mt-3 items-center rounded-2xl bg-[#163B32] px-5 py-4 disabled:opacity-40"
        >
          <Text className="font-semibold text-white">{submitCheckIn.isPending ? (isOnline ? 'Saving…' : 'Queued offline') : 'Save check-in'}</Text>
        </Pressable>
        {data.note ? <Text className="mt-3 text-sm text-[#587068] dark:text-[#AEBDB7]">Latest: {data.note}</Text> : null}
      </View>
    </ScrollView>
  );
}
