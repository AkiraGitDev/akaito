import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { Memory } from '@/lib/queries/memories';

type Props = {
  memories: Memory[];
  selectedDate: string | null;
  onSelectDate: (isoDate: string | null) => void;
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type DayCellProps = {
  day: Date;
  count: number;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
};

function DayCell({ day, count, isSelected, isToday, onPress }: DayCellProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const disabled = count === 0 && !isToday;

  return (
    <View style={{ width: `${100 / 7}%`, height: 48 }} className="items-center justify-center">
      <Pressable
        onPressIn={() => {
          if (disabled) return;
          scale.value = withSpring(0.85, { damping: 12, stiffness: 220 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 220 });
        }}
        onPress={onPress}
        disabled={disabled}>
        <Animated.View
          style={animStyle}
          className={`h-10 w-10 items-center justify-center rounded-full ${
            isSelected
              ? 'bg-love-600'
              : count > 0
              ? 'bg-love-200'
              : ''
          } ${isToday && !isSelected ? 'border border-love-400' : ''}`}>
          <Text
            className={
              isSelected
                ? 'text-white'
                : count > 0
                ? 'text-love-800'
                : 'text-gray-700'
            }
            style={{
              fontFamily: count > 0 ? 'Inter_600SemiBold' : 'Inter_400Regular',
              fontSize: 14,
            }}>
            {day.getDate()}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export function MemoryCalendar({ memories, selectedDate, onSelectDate }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const today = new Date();

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const leadingEmpty = useMemo(() => getDay(startOfMonth(month)), [month]);

  const dateCounts = useMemo(() => {
    const map = new Map<string, number>();
    memories.forEach((m) => {
      map.set(m.memory_date, (map.get(m.memory_date) ?? 0) + 1);
    });
    return map;
  }, [memories]);

  const monthLabel = capitalize(format(month, "MMMM 'de' yyyy", { locale: ptBR }));
  const monthKey = format(month, 'yyyy-MM');

  return (
    <View>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => setMonth((m) => addMonths(m, -1))}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-love-100">
          <Ionicons name="chevron-back" size={22} color="#c40b43" />
        </Pressable>
        <Animated.Text
          key={monthKey}
          entering={FadeIn.duration(220)}
          className="text-love-700 text-xl"
          style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
          {monthLabel}
        </Animated.Text>
        <Pressable
          onPress={() => setMonth((m) => addMonths(m, 1))}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-love-100">
          <Ionicons name="chevron-forward" size={22} color="#c40b43" />
        </Pressable>
      </View>

      <View className="mb-2 flex-row">
        {WEEKDAYS.map((day, i) => (
          <View key={i} className="flex-1 items-center">
            <Text
              className="text-xs text-gray-400"
              style={{ fontFamily: 'Inter_500Medium' }}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      <Animated.View
        key={monthKey}
        entering={FadeIn.duration(260)}
        className="flex-row flex-wrap">
        {Array.from({ length: leadingEmpty }).map((_, i) => (
          <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, height: 48 }} />
        ))}
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const count = dateCounts.get(key) ?? 0;
          return (
            <DayCell
              key={key}
              day={d}
              count={count}
              isSelected={selectedDate === key}
              isToday={isSameDay(d, today)}
              onPress={() => onSelectDate(selectedDate === key ? null : key)}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}
