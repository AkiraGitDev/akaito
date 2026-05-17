import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { parseISO } from 'date-fns';

import { useMemories, type Memory } from '@/lib/queries/memories';
import { MemoryCalendar } from '@/components/features/memory-calendar';

const CARD_SHADOW = {
  shadowColor: '#c40b43',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

const MONTHS_PT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

function formatMemoryDate(iso: string): string {
  const d = parseISO(iso);
  return `${d.getUTCDate()} de ${MONTHS_PT[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

type ViewMode = 'timeline' | 'calendar';

function MemoryCard({ memory, onPress }: { memory: Memory; onPress: () => void }) {
  const cover = memory.photos[0];
  const extra = memory.photos.length - 1;

  return (
    <Pressable
      onPress={onPress}
      style={CARD_SHADOW}
      className="mb-5 overflow-hidden rounded-3xl bg-white active:opacity-80">
      {cover ? (
        <View>
          <Image
            source={{ uri: cover.public_url }}
            style={{ width: '100%', aspectRatio: 4 / 3 }}
            contentFit="cover"
          />
          {extra > 0 && (
            <View className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1">
              <Text
                className="text-xs text-white"
                style={{ fontFamily: 'Inter_600SemiBold' }}>
                +{extra}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View
          className="items-center justify-center bg-love-100"
          style={{ aspectRatio: 4 / 3 }}>
          <Text className="text-4xl">📷</Text>
        </View>
      )}

      <View className="p-4">
        <Text
          className="text-love-700 text-xl"
          style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
          {formatMemoryDate(memory.memory_date)}
        </Text>
        {memory.location_name && (
          <View className="mt-1 flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#9ca3af" />
            <Text
              className="ml-1 text-sm text-gray-500"
              style={{ fontFamily: 'Inter_400Regular' }}
              numberOfLines={1}>
              {memory.location_name}
            </Text>
          </View>
        )}
        {memory.caption && (
          <Text
            className="mt-2 text-base text-gray-700"
            style={{ fontFamily: 'Inter_400Regular' }}
            numberOfLines={3}>
            {memory.caption}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const position = useSharedValue(mode === 'timeline' ? 0 : 1);

  useEffect(() => {
    position.value = withTiming(mode === 'timeline' ? 0 : 1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [mode, position]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * (trackWidth / 2) }],
  }));

  function handleLayout(e: LayoutChangeEvent) {
    setTrackWidth(e.nativeEvent.layout.width - 8);
  }

  return (
    <View
      className="mb-6 flex-row rounded-2xl bg-white p-1"
      style={CARD_SHADOW}
      onLayout={handleLayout}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 4,
            left: 4,
            bottom: 4,
            width: trackWidth / 2,
            borderRadius: 12,
            backgroundColor: '#e91550',
          },
          indicatorStyle,
        ]}
      />
      {(['timeline', 'calendar'] as const).map((m) => {
        const isActive = mode === m;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            className="flex-1 items-center rounded-xl py-2">
            <Text
              className={isActive ? 'text-white' : 'text-love-700'}
              style={{ fontFamily: 'Inter_600SemiBold' }}>
              {m === 'timeline' ? 'Timeline' : 'Calendário'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Memories() {
  const router = useRouter();
  const { data: memories, isLoading } = useMemories();
  const [mode, setMode] = useState<ViewMode>('timeline');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedMemories = useMemo(() => {
    if (!selectedDate || !memories) return [];
    return memories.filter((m) => m.memory_date === selectedDate);
  }, [memories, selectedDate]);

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <ScrollView contentContainerClassName="px-6 pt-4 pb-24">
        <Text
          className="text-love-700 mb-6 text-4xl"
          style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
          Memórias
        </Text>

        <ModeToggle mode={mode} onChange={setMode} />

        {isLoading ? (
          <Text
            className="text-base text-gray-400"
            style={{ fontFamily: 'Inter_400Regular' }}>
            Carregando...
          </Text>
        ) : !memories || memories.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(500)}
            className="mt-20 items-center px-6">
            <Text className="text-6xl">📸</Text>
            <Text
              className="text-love-700 mt-4 text-2xl"
              style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
              Sem memórias ainda
            </Text>
            <Text
              className="mt-2 text-center text-base text-gray-500"
              style={{ fontFamily: 'Inter_400Regular' }}>
              Toque no + pra guardar o primeiro momento.
            </Text>
          </Animated.View>
        ) : mode === 'timeline' ? (
          memories.map((memory, index) => (
            <Animated.View
              key={memory.id}
              entering={FadeIn.duration(400).delay(index * 60)}>
              <MemoryCard memory={memory} onPress={() => router.push(`/memory/${memory.id}`)} />
            </Animated.View>
          ))
        ) : (
          <>
            <Animated.View
              entering={FadeIn.duration(400)}
              style={CARD_SHADOW}
              className="mb-6 rounded-3xl bg-white p-5">
              <MemoryCalendar
                memories={memories}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </Animated.View>

            {selectedDate && selectedMemories.length === 0 && (
              <Text
                className="mt-4 text-center text-sm text-gray-400"
                style={{ fontFamily: 'Inter_400Regular' }}>
                Sem memórias nesse dia.
              </Text>
            )}

            {selectedMemories.map((memory, index) => (
              <Animated.View
                key={memory.id}
                entering={FadeIn.duration(400).delay(index * 60)}>
                <MemoryCard
                  memory={memory}
                  onPress={() => router.push(`/memory/${memory.id}`)}
                />
              </Animated.View>
            ))}

            {!selectedDate && (
              <Text
                className="mt-2 text-center text-sm text-gray-400"
                style={{ fontFamily: 'Inter_400Regular' }}>
                Toque num dia destacado pra ver as memórias.
              </Text>
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/memory/new')}
        style={CARD_SHADOW}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-love-600 active:bg-love-700">
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
