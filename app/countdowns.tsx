import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useCountdowns, type Countdown } from '@/lib/queries/countdowns';
import { daysFromNow, formatBRDate, formatDaysRemaining } from '@/lib/utils/dates';

const ROW_SHADOW = {
  shadowColor: '#c40b43',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

function CountdownRow({
  item,
  onPress,
  index,
}: {
  item: Countdown;
  onPress: () => void;
  index: number;
}) {
  const days = daysFromNow(item.target_date);
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 60)}>
      <Pressable
        onPress={onPress}
        style={ROW_SHADOW}
        className="mb-3 flex-row items-center rounded-2xl bg-white p-4 active:bg-love-100">
        <Text className="mr-4 text-3xl">{item.emoji || '📅'}</Text>
        <View className="flex-1">
          <Text
            className="text-base text-gray-800"
            numberOfLines={1}
            style={{ fontFamily: 'Inter_600SemiBold' }}>
            {item.title}
          </Text>
          <Text
            className="text-sm text-gray-500"
            style={{ fontFamily: 'Inter_400Regular' }}>
            {formatBRDate(item.target_date)}
          </Text>
        </View>
        <View className="items-end">
          <Text
            className="text-love-600 text-2xl"
            style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
            {days}
          </Text>
          <Text
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Inter_400Regular' }}>
            {formatDaysRemaining(days)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CountdownsScreen() {
  const router = useRouter();
  const { data: countdowns, isLoading } = useCountdowns();

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <Stack.Screen
        options={{
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
            <Text className="text-6xl">📅</Text>
            <Text
              className="text-love-700 mt-4 text-2xl"
              style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
              Sem eventos ainda
            </Text>
            <Text
              className="mt-2 text-center text-base text-gray-500"
              style={{ fontFamily: 'Inter_400Regular' }}>
              Toque no + lá em cima pra adicionar o primeiro.
            </Text>
          </View>
        ) : (
          countdowns.map((item, index) => (
            <CountdownRow
              key={item.id}
              item={item}
              index={index}
              onPress={() => router.push(`/countdown/${item.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
