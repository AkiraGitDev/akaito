import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { daysTogether, nextMilestone } from '@/lib/utils/dates';

export default function Home() {
  const days = daysTogether();
  const next = nextMilestone(days);
  const remaining = next - days;

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-love-700 text-base font-medium">juntos há</Text>
        <Text className="text-love-600 text-8xl font-bold tracking-tight">{days}</Text>
        <Text className="text-love-700 text-2xl">dias 💖</Text>
        <Text className="text-love-500 mt-8 text-sm">
          faltam {remaining} para {next}
        </Text>
      </View>
    </SafeAreaView>
  );
}
