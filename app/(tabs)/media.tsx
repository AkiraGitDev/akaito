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

import {
  STATUS_LABEL,
  TYPE_EMOJI,
  TYPE_LABEL,
  useMediaList,
  type Media,
  type MediaStatus,
  type MediaType,
} from '@/lib/queries/media';

const CARD_SHADOW = {
  shadowColor: '#c40b43',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

const STATUS_FILTERS: Array<{ key: MediaStatus | 'all'; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'want', label: 'Queremos' },
  { key: 'watching', label: 'Vendo' },
  { key: 'done', label: 'Visto' },
];

const TYPE_FILTERS: Array<{ key: MediaType | 'all'; label: string; emoji: string }> = [
  { key: 'all', label: 'Todos', emoji: '🎯' },
  { key: 'movie', label: 'Filmes', emoji: TYPE_EMOJI.movie },
  { key: 'series', label: 'Séries', emoji: TYPE_EMOJI.series },
  { key: 'anime', label: 'Animes', emoji: TYPE_EMOJI.anime },
];

function StatusToggle({
  value,
  onChange,
}: {
  value: MediaStatus | 'all';
  onChange: (v: MediaStatus | 'all') => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const activeIndex = STATUS_FILTERS.findIndex((f) => f.key === value);
  const position = useSharedValue(activeIndex);

  useEffect(() => {
    position.value = withTiming(activeIndex, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeIndex, position]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * (trackWidth / STATUS_FILTERS.length) }],
  }));

  function handleLayout(e: LayoutChangeEvent) {
    setTrackWidth(e.nativeEvent.layout.width - 8);
  }

  return (
    <View
      className="mb-4 flex-row rounded-2xl bg-white p-1"
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
            width: trackWidth / STATUS_FILTERS.length,
            borderRadius: 12,
            backgroundColor: '#e91550',
          },
          indicatorStyle,
        ]}
      />
      {STATUS_FILTERS.map((f) => {
        const isActive = value === f.key;
        return (
          <Pressable
            key={f.key}
            onPress={() => onChange(f.key)}
            className="flex-1 items-center rounded-xl py-2">
            <Text
              className={isActive ? 'text-white text-sm' : 'text-love-700 text-sm'}
              style={{ fontFamily: 'Inter_600SemiBold' }}>
              {f.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MediaCard({ media, onPress }: { media: Media; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={CARD_SHADOW}
      className="mb-4 flex-row overflow-hidden rounded-3xl bg-white active:opacity-80">
      <View className="h-32 w-24 items-center justify-center bg-love-100">
        {media.cover_url ? (
          <Image
            source={{ uri: media.cover_url }}
            style={{ width: 96, height: 128 }}
            contentFit="cover"
          />
        ) : (
          <Text className="text-4xl">{TYPE_EMOJI[media.type]}</Text>
        )}
      </View>
      <View className="flex-1 justify-between p-4">
        <View>
          <Text
            className="text-love-700 text-lg"
            style={{ fontFamily: 'DMSerifDisplay_400Regular' }}
            numberOfLines={2}>
            {media.title}
          </Text>
          <Text
            className="mt-1 text-xs text-gray-500"
            style={{ fontFamily: 'Inter_500Medium' }}>
            {TYPE_EMOJI[media.type]} {TYPE_LABEL[media.type]}
          </Text>
        </View>
        <View className="self-start rounded-full bg-love-100 px-3 py-1">
          <Text
            className="text-love-700 text-xs"
            style={{ fontFamily: 'Inter_600SemiBold' }}>
            {STATUS_LABEL[media.status]}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function MediaTab() {
  const router = useRouter();
  const { data: list, isLoading } = useMediaList();
  const [statusFilter, setStatusFilter] = useState<MediaStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<MediaType | 'all'>('all');

  const filtered = useMemo(() => {
    if (!list) return [];
    return list.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      return true;
    });
  }, [list, statusFilter, typeFilter]);

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <ScrollView contentContainerClassName="px-6 pt-4 pb-24">
        <Text
          className="text-love-700 mb-6 text-4xl"
          style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
          Pra ver
        </Text>

        <StatusToggle value={statusFilter} onChange={setStatusFilter} />

        <View className="mb-6 flex-row gap-2">
          {TYPE_FILTERS.map((f) => {
            const isActive = typeFilter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setTypeFilter(f.key)}
                className={`flex-1 flex-row items-center justify-center rounded-full px-2 py-2 ${
                  isActive ? 'bg-love-600' : 'bg-white border border-love-200'
                }`}>
                <Text className="mr-1 text-sm">{f.emoji}</Text>
                <Text
                  className={isActive ? 'text-white text-xs' : 'text-love-700 text-xs'}
                  style={{ fontFamily: 'Inter_500Medium' }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <Text
            className="text-base text-gray-400"
            style={{ fontFamily: 'Inter_400Regular' }}>
            Carregando...
          </Text>
        ) : filtered.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(500)}
            className="mt-20 items-center px-6">
            <Text className="text-6xl">🎬</Text>
            <Text
              className="text-love-700 mt-4 text-2xl"
              style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
              {list && list.length === 0 ? 'Sem nada na lista' : 'Nada por aqui'}
            </Text>
            <Text
              className="mt-2 text-center text-base text-gray-500"
              style={{ fontFamily: 'Inter_400Regular' }}>
              {list && list.length === 0
                ? 'Toque no + pra adicionar o primeiro.'
                : 'Tenta outro filtro.'}
            </Text>
          </Animated.View>
        ) : (
          filtered.map((m, index) => (
            <Animated.View key={m.id} entering={FadeIn.duration(400).delay(index * 50)}>
              <MediaCard media={m} onPress={() => router.push(`/media/${m.id}`)} />
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/media/new')}
        style={CARD_SHADOW}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-love-600 active:bg-love-700">
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
