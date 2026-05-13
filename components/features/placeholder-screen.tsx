import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title: string;
  emoji: string;
};

export function PlaceholderScreen({ title, emoji }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-6xl">{emoji}</Text>
        <Text className="text-love-700 mt-4 text-2xl font-semibold">{title}</Text>
        <Text className="mt-2 text-base text-gray-500">em breve</Text>
      </View>
    </SafeAreaView>
  );
}
