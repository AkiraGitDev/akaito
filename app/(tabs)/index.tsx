import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useMyProfile, usePartnerProfile, type Profile } from '@/lib/queries/profiles';
import { calculateAge, daysTogether, nextMilestone } from '@/lib/utils/dates';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

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
      className="flex-1 items-center rounded-3xl bg-white p-5 active:bg-love-100">
      <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-love-200">
        <Text className="text-love-700 text-2xl font-bold">
          {profile ? initialsOf(name) : '💞'}
        </Text>
      </View>
      <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
        {name}
      </Text>
      {age !== null ? (
        <Text className="text-sm text-gray-500">{age} anos</Text>
      ) : profile ? (
        <Text className="text-sm text-gray-400">Sem aniversário</Text>
      ) : (
        <Text className="text-sm text-gray-400">Esperando...</Text>
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

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <ScrollView contentContainerClassName="px-6 pt-4 pb-8">
        <View className="mb-10 items-center">
          <Text className="text-love-700 text-base font-medium">Juntos há</Text>
          <Text className="text-love-600 text-8xl font-bold tracking-tight">{days}</Text>
          <Text className="text-love-700 text-2xl">Dias 💖</Text>
        </View>

        <View className="mb-8 rounded-3xl bg-white p-5">
          <Text className="mb-2 text-sm text-gray-500">Próximo marco</Text>
          <View className="mb-2 flex-row items-baseline justify-between">
            <Text className="text-love-700 text-2xl font-bold">{next} dias</Text>
            <Text className="text-sm text-gray-500">Faltam {remaining}</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-love-100">
            <View
              className="h-full bg-love-500"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <View className="flex-row gap-3">
          <ProfileCard
            profile={me ?? null}
            placeholder="Você"
            onPress={() => router.push('/profile')}
          />
          <ProfileCard profile={partner ?? null} placeholder="Ela" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
