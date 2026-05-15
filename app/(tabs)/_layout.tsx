import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e91550',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="memories"
        options={{
          title: 'Memórias',
          tabBarIcon: ({ color, size }) => <Ionicons name="images" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: 'Pra ver',
          tabBarIcon: ({ color, size }) => <Ionicons name="film" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="places"
        options={{
          title: 'Lugares',
          tabBarIcon: ({ color, size }) => <Ionicons name="location" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
