import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Props = {
  title: string;
  emoji: string;
};

export function PlaceholderScreen({ title, emoji }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="flex-1 items-center justify-center px-6">
        <Text className="text-7xl">{emoji}</Text>
        <Text
          className="text-love-700 mt-6 text-3xl"
          style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
          {title}
        </Text>
        <Text
          className="mt-2 text-base text-gray-500"
          style={{ fontFamily: 'Inter_400Regular' }}>
          em breve
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}
