import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { useSubmitData } from '../../hooks/useSubmitData';
import { useOfflineSync } from '../../hooks/useOfflineSync';

type Dashboard = { healthScore: number | null; hydrationMl: number | null; mood: number | null; focus: number | null; note?: string | null };

export default function HomeScreen() {
  const [note, setNote] = useState('');
  const { isOnline } = useOfflineSync();
  const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => apiFetch<Dashboard>('/dashboard') });
  const submitCheckIn = useSubmitData<Dashboard, { note: string }>({ path: '/check-ins', queryKey: ['dashboard'], optimisticUpdate: (current, variables) => ({ ...(current ?? { healthScore: null, hydrationMl: null, mood: null, focus: null }), note: variables.note }) });
  const data = dashboard.data;

  const submit = () => { const value = note.trim(); if (!value) return; submitCheckIn.submit({ note: value }); setNote(''); };
  const metric = (label: string, value: string) => <View className="mb-4 w-[48%] rounded-3xl bg-white p-5 dark:bg-[#18231F]"><Text className="text-sm text-[#6C817A] dark:text-[#9EB1A9]">{label}</Text><Text className="mt-2 text-2xl font-bold text-[#163B32] dark:text-white">{value}</Text></View>;

  return <ScrollView className="flex-1 bg-[#F4F7F5] px-5 pb-10 pt-16 dark:bg-[#0F1714]" contentContainerStyle={{ paddingBottom: 24 }}>
    <Text className="text-sm font-semibold tracking-widest text-[#6C817A] dark:text-[#9EB1A9]">LIVYA AI</Text>
    <Text className="mt-2 text-3xl font-bold text-[#163B32] dark:text-white">Good morning</Text>
    <Text className="mt-1 text-base text-[#587068] dark:text-[#AEBDB7]">Your health at a glance</Text>
    <View className="mt-8 flex-row flex-wrap justify-between">
      {metric('Health Score', data?.healthScore == null ? '—' : String(data.healthScore))}
      {metric('Hydration', data?.hydrationMl == null ? '—' : `${(data.hydrationMl / 1000).toFixed(1)} L`)}
      {metric('Mood', data?.mood == null ? '—' : `${data.mood}/10`)}
      {metric('Focus', data?.focus == null ? '—' : `${data.focus}/10`)}
    </View>
    <View className="rounded-3xl bg-[#163B32] p-6"><Text className="text-lg font-bold text-white">Today's plan</Text><Text className="mt-2 leading-6 text-[#D8E6E0]">Your care plan and next actions will appear here when assigned.</Text></View>
    <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-[#18231F]"><Text className="text-lg font-bold text-[#163B32] dark:text-white">Quick check-in</Text><Text className="mt-1 text-sm text-[#6C817A] dark:text-[#9EB1A9]">Record how you are feeling. Your entry is saved to your LIVYA account.</Text><TextInput value={note} onChangeText={setNote} placeholder="How are you feeling today?" placeholderTextColor="#8B9B95" multiline className="mt-4 min-h-24 rounded-2xl bg-[#F4F7F5] px-4 py-3 text-[#163B32] dark:bg-[#101815] dark:text-white"/><Pressable disabled={!note.trim() || submitCheckIn.isPending} onPress={submit} className="mt-3 items-center rounded-2xl bg-[#163B32] px-5 py-4 disabled:opacity-40"><Text className="font-semibold text-white">{submitCheckIn.isPending ? (isOnline ? 'Saving…' : 'Queued offline') : 'Save check-in'}</Text></Pressable>{data?.note ? <Text className="mt-3 text-sm text-[#587068] dark:text-[#AEBDB7]">Latest: {data.note}</Text> : null}</View>
    {!dashboard.isPending && !data && <View className="mt-5 rounded-3xl bg-white p-5 dark:bg-[#18231F]"><Text className="font-semibold text-[#163B32] dark:text-white">Health data unavailable</Text><Text className="mt-1 text-sm text-[#6C817A] dark:text-[#AEBDB7]">Connect your account to load your latest health data.</Text></View>}
  </ScrollView>;
}
