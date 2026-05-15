import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import {
  useCountdown,
  useCreateCountdown,
  useDeleteCountdown,
  useUpdateCountdown,
} from '@/lib/queries/countdowns';
import { formatBRDate, maskBRDate, parseBRDate } from '@/lib/utils/dates';
import { confirmDestructive } from '@/lib/utils/confirm';

const EMOJI_OPTIONS = [
  '🎂', '🎉', '🎁', '🍾', '🥂',
  '💍', '💑', '❤️', '🌹', '💐',
  '✈️', '🚗', '🏖️', '🗺️', '🏨',
  '🎄', '🎃', '🎆', '🌟', '🍀',
  '🎬', '🎵', '🎤', '⚽', '🏆',
  '📚', '🎓', '💼', '🏥', '📅',
];

export default function CountdownForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { data: existing, isLoading } = useCountdown(isNew ? null : id);

  const create = useCreateCountdown();
  const update = useUpdateCountdown();
  const remove = useDeleteCountdown();

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setEmoji(existing.emoji ?? '');
      setDate(formatBRDate(existing.target_date));
    }
  }, [existing]);

  const pending = create.isPending || update.isPending || remove.isPending;

  async function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Ops', 'Coloca um título.');
      return;
    }
    const iso = parseBRDate(date.trim());
    if (!iso) {
      Alert.alert('Ops', 'Data inválida. Use DD/MM/AAAA.');
      return;
    }
    const payload = { title: trimmedTitle, target_date: iso, emoji: emoji.trim() || null };
    try {
      if (isNew) {
        await create.mutateAsync(payload);
      } else {
        await update.mutateAsync({ id: id!, ...payload });
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message ?? 'Tenta de novo.');
    }
  }

  async function handleDelete() {
    if (isNew) return;
    const ok = await confirmDestructive('Apagar evento', 'Tem certeza?');
    if (!ok) return;
    try {
      await remove.mutateAsync(id!);
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao apagar', e.message ?? 'Tenta de novo.');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <Stack.Screen options={{ title: isNew ? 'Novo evento' : 'Editar evento' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 py-8"
          keyboardShouldPersistTaps="handled">
          {isLoading && !isNew ? (
            <ActivityIndicator color="#c40b43" />
          ) : (
            <>
              <Text
                className="mb-1 text-sm text-gray-500"
                style={{ fontFamily: 'Inter_500Medium' }}>
                Emoji
              </Text>
              <View className="mb-5 flex-row flex-wrap gap-2 rounded-2xl border border-love-200 bg-white p-3">
                {EMOJI_OPTIONS.map((e) => {
                  const selected = emoji === e;
                  return (
                    <Pressable
                      key={e}
                      onPress={() => setEmoji(selected ? '' : e)}
                      className={`h-12 w-12 items-center justify-center rounded-xl ${
                        selected ? 'bg-love-200' : 'bg-love-50'
                      }`}>
                      <Text className="text-2xl">{e}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                className="mb-1 text-sm text-gray-500"
                style={{ fontFamily: 'Inter_500Medium' }}>
                Título
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Aniversário dela, viagem, ..."
                style={{ fontFamily: 'Inter_400Regular' }}
                className="mb-5 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
              />

              <Text
                className="mb-1 text-sm text-gray-500"
                style={{ fontFamily: 'Inter_500Medium' }}>
                Data
              </Text>
              <TextInput
                value={date}
                onChangeText={(v) => setDate(maskBRDate(v))}
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                maxLength={10}
                style={{ fontFamily: 'Inter_400Regular' }}
                className="mb-8 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
              />

              <Pressable
                onPress={handleSave}
                disabled={pending}
                className="mb-3 rounded-2xl bg-love-600 py-4 active:bg-love-700 disabled:opacity-50">
                {pending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className="text-center text-base text-white"
                    style={{ fontFamily: 'Inter_600SemiBold' }}>
                    Salvar
                  </Text>
                )}
              </Pressable>

              {!isNew && (
                <Pressable
                  onPress={handleDelete}
                  disabled={pending}
                  className="mt-8 rounded-2xl border border-red-200 bg-white py-4 active:bg-red-50">
                  <Text
                    className="text-center text-base text-red-600"
                    style={{ fontFamily: 'Inter_600SemiBold' }}>
                    Apagar
                  </Text>
                </Pressable>
              )}

              <View className="h-8" />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
