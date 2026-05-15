import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useCountdowns, type Countdown } from '@/lib/queries/countdowns';
import { daysFromNow, formatBRDate, formatDaysRemaining } from '@/lib/utils/dates';

function CountdownRow({ item, onPress }: { item: Countdown; onPress: () => void }) {
  const days = daysFromNow(item.target_date);
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl bg-white p-4 active:bg-love-100">
      <Text className="mr-4 text-3xl">{item.emoji || '📅'}</Text>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-sm text-gray-500">{formatBRDate(item.target_date)}</Text>
      </View>
      <View className="items-end">
        <Text className="text-love-600 text-lg font-bold">{days}</Text>
        <Text className="text-xs text-gray-500">{formatDaysRemaining(days)}</Text>
      </View>
    </Pressable>
  );
}

export default function CountdownsScreen() {
  const router = useRouter();
  const { data: countdowns, isLoading } = useCountdowns();

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Countdowns',
          headerStyle: { backgroundColor: '#fff1f3' },
          headerTintColor: '#c40b43',
          headerRight: () => (
            <Pressable onPress={() => router.push('/countdown/new')} className="px-2">
              <Ionicons name="add" size={28} color="#c40b43" />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerClassName="px-6 py-6">
        {isLoading ? (
          <ActivityIndicator color="#c40b43" />
        ) : !countdowns || countdowns.length === 0 ? (
          <View className="items-center pt-20">
            <Text className="text-5xl">📅</Text>
            <Text className="text-love-700 mt-4 text-xl font-semibold">Sem eventos ainda</Text>
            <Text className="mt-2 text-center text-base text-gray-500">
              Toque no + lá em cima pra adicionar o primeiro.
            </Text>
          </View>
        ) : (
          countdowns.map((item) => (
            <CountdownRow
              key={item.id}
              item={item}
              onPress={() => router.push(`/countdown/${item.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
