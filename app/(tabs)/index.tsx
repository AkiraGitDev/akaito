import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useMyProfile, usePartnerProfile, type Profile } from '@/lib/queries/profiles';
import { useCountdowns } from '@/lib/queries/countdowns';
import {
  calculateAge,
  daysFromNow,
  daysTogether,
  formatDaysRemaining,
  nextMilestone,
} from '@/lib/utils/dates';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const CARD_SHADOW = {
  shadowColor: '#c40b43',
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

type CardProps = {
  profile: Profile | null;
  placeholder: string;
  onPress?: () => void;
};

function ProfileCard({ profile, placeholder, onPress }: CardProps) {
  const name = profile?.name?.trim() || placeholder;
  const age = calculateAge(profile?.birthday ?? null);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={CARD_SHADOW}
      className="flex-1 items-center rounded-3xl bg-white p-5 active:bg-love-100">
      <View className="mb-3 h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-love-200">
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            style={{ width: 80, height: 80 }}
            contentFit="cover"
          />
        ) : (
          <Text className="text-love-700 font-serif text-3xl">
            {profile ? initialsOf(name) : '💞'}
          </Text>
        )}
      </View>
      <Text
        className="font-sans text-base font-semibold text-gray-800"
        numberOfLines={1}
        style={{ fontFamily: 'Inter_600SemiBold' }}>
        {name}
      </Text>
      {age !== null ? (
        <Text
          className="text-sm text-gray-500"
          style={{ fontFamily: 'Inter_400Regular' }}>
          {age} anos
        </Text>
      ) : profile ? (
        <Text
          className="text-sm text-gray-400"
          style={{ fontFamily: 'Inter_400Regular' }}>
          Sem aniversário
        </Text>
      ) : (
        <Text
          className="text-sm text-gray-400"
          style={{ fontFamily: 'Inter_400Regular' }}>
          Esperando...
        </Text>
      )}
    </Pressable>
  );
}

export default function Home() {
  const router = useRouter();
  const days = daysTogether();
  const next = nextMilestone(days);
  const remaining = next - days;
  const progress = Math.min(100, Math.round((days / next) * 100));

  const { data: me } = useMyProfile();
  const { data: partner } = usePartnerProfile();
  const { data: events } = useCountdowns();
  const upcoming = events?.slice(0, 3) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <ScrollView contentContainerClassName="px-6 pt-4 pb-8">
        <Animated.View
          entering={FadeInDown.duration(700).springify()}
          className="mb-10 items-center">
          <Text
            className="text-love-700 text-base"
            style={{ fontFamily: 'Inter_500Medium' }}>
            Juntos há
          </Text>
          <Text
            className="text-love-600 text-8xl leading-tight"
            style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
            {days}
          </Text>
          <Text
            className="text-love-700 text-2xl"
            style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
            Dias 💖
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(700).delay(150)}
          style={CARD_SHADOW}
          className="mb-6 rounded-3xl bg-white p-5">
          <Text
            className="mb-2 text-sm text-gray-500"
            style={{ fontFamily: 'Inter_500Medium' }}>
            Próximo marco
          </Text>
          <View className="mb-3 flex-row items-baseline justify-between">
            <Text
              className="text-love-700 text-3xl"
              style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
              {next} dias
            </Text>
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Inter_400Regular' }}>
              Faltam {remaining}
            </Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-love-100">
            <View className="h-full bg-love-500" style={{ width: `${progress}%` }} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(700).delay(300)}>
          <Pressable
            onPress={() => router.push('/countdowns')}
            style={CARD_SHADOW}
            className="mb-8 rounded-3xl bg-white p-5 active:bg-love-100">
            <Text
              className="mb-3 text-sm text-gray-500"
              style={{ fontFamily: 'Inter_500Medium' }}>
              Próximos eventos
            </Text>
            {upcoming.length === 0 ? (
              <Text
                className="text-base text-gray-400"
                style={{ fontFamily: 'Inter_400Regular' }}>
                Sem eventos. Toque pra adicionar.
              </Text>
            ) : (
              upcoming.map((event, index) => {
                const days = daysFromNow(event.target_date);
                return (
                  <View
                    key={event.id}
                    className={`flex-row items-center py-2 ${
                      index < upcoming.length - 1 ? 'border-b border-love-100' : ''
                    }`}>
                    <Text className="mr-4 text-2xl">{event.emoji || '📅'}</Text>
                    <View className="flex-1">
                      <Text
                        className="text-base text-gray-800"
                        numberOfLines={1}
                        style={{ fontFamily: 'Inter_600SemiBold' }}>
                        {event.title}
                      </Text>
                      <Text
                        className="text-xs text-gray-500"
                        style={{ fontFamily: 'Inter_400Regular' }}>
                        {formatDaysRemaining(days)}
                      </Text>
                    </View>
                    <Text
                      className="text-love-600 text-2xl"
                      style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
                      {days}
                    </Text>
                  </View>
                );
              })
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeIn.duration(700).delay(450)} className="flex-row gap-3">
          <ProfileCard
            profile={me ?? null}
            placeholder="Você"
            onPress={() => router.push('/profile')}
          />
          <ProfileCard profile={partner ?? null} placeholder="Ela" />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
