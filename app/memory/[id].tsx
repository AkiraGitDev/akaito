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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import {
  useAddPhotos,
  useCreateMemory,
  useDeleteMemory,
  useDeletePhoto,
  useMemory,
  useUpdateMemory,
  type MemoryPhoto,
} from '@/lib/queries/memories';
import { formatBRDate, maskBRDate, parseBRDate } from '@/lib/utils/dates';
import { confirmDestructive } from '@/lib/utils/confirm';

async function pickImages(): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Sem permissão', 'Preciso de acesso às fotos.');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 0.7,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => a.uri);
}

export default function MemoryForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const { data: existing, isLoading } = useMemory(isNew ? null : id);
  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();
  const addPhotos = useAddPhotos();
  const deletePhoto = useDeletePhoto();
  const deleteMemory = useDeleteMemory();

  const [date, setDate] = useState(formatBRDate(new Date().toISOString().slice(0, 10)));
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [pendingUris, setPendingUris] = useState<string[]>([]);

  useEffect(() => {
    if (existing) {
      setDate(formatBRDate(existing.memory_date));
      setCaption(existing.caption ?? '');
      setLocation(existing.location_name ?? '');
    }
  }, [existing]);

  async function handleAddPhotos() {
    const uris = await pickImages();
    if (uris.length === 0) return;
    if (isNew) {
      setPendingUris((prev) => [...prev, ...uris]);
    } else if (id) {
      const startPosition = (existing?.photos.length ?? 0);
      try {
        await addPhotos.mutateAsync({ memoryId: id, photoUris: uris, startPosition });
      } catch (e: any) {
        Alert.alert('Erro ao enviar fotos', e.message ?? 'Tenta de novo.');
      }
    }
  }

  function removePending(index: number) {
    setPendingUris((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDeletePhoto(photo: MemoryPhoto) {
    const ok = await confirmDestructive('Apagar foto', 'Tem certeza?');
    if (!ok) return;
    try {
      await deletePhoto.mutateAsync({
        id: photo.id,
        storage_path: photo.storage_path,
        memory_id: photo.memory_id,
      });
    } catch (e: any) {
      Alert.alert('Erro ao apagar', e.message ?? 'Tenta de novo.');
    }
  }

  async function handleSave() {
    const dateIso = parseBRDate(date.trim());
    if (!dateIso) {
      Alert.alert('Ops', 'Data inválida. Use DD/MM/AAAA.');
      return;
    }
    const captionVal = caption.trim() || null;
    const locationVal = location.trim() || null;

    try {
      if (isNew) {
        if (pendingUris.length === 0) {
          Alert.alert('Ops', 'Adiciona pelo menos uma foto.');
          return;
        }
        await createMemory.mutateAsync({
          memory_date: dateIso,
          caption: captionVal,
          location_name: locationVal,
          photoUris: pendingUris,
        });
      } else if (id) {
        await updateMemory.mutateAsync({
          id,
          memory_date: dateIso,
          caption: captionVal,
          location_name: locationVal,
        });
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message ?? 'Tenta de novo.');
    }
  }

  async function handleDeleteMemory() {
    if (isNew || !id) return;
    const ok = await confirmDestructive(
      'Apagar memória',
      'Vai apagar todas as fotos junto. Tem certeza?',
    );
    if (!ok) return;
    try {
      await deleteMemory.mutateAsync(id);
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao apagar', e.message ?? 'Tenta de novo.');
    }
  }

  const saving = createMemory.isPending || updateMemory.isPending;
  const uploadingMore = addPhotos.isPending;

  if (!isNew && isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-love-50">
        <ActivityIndicator color="#c40b43" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-love-50" edges={['bottom']}>
      <Stack.Screen options={{ title: isNew ? 'Nova memória' : 'Memória' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled">
          {!isNew && existing && existing.photos.length > 0 && (
            <View className="mb-5 flex-row flex-wrap gap-2">
              {existing.photos.map((photo) => (
                <Pressable
                  key={photo.id}
                  onLongPress={() => handleDeletePhoto(photo)}
                  className="relative">
                  <Image
                    source={{ uri: photo.public_url }}
                    style={{ width: 100, height: 100, borderRadius: 12 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => handleDeletePhoto(photo)}
                    className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-full bg-red-600">
                    <Ionicons name="close" size={16} color="white" />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}

          {isNew && pendingUris.length > 0 && (
            <View className="mb-5 flex-row flex-wrap gap-2">
              {pendingUris.map((uri, idx) => (
                <View key={uri + idx} className="relative">
                  <Image
                    source={{ uri }}
                    style={{ width: 100, height: 100, borderRadius: 12 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => removePending(idx)}
                    className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-full bg-red-600">
                    <Ionicons name="close" size={16} color="white" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={handleAddPhotos}
            disabled={uploadingMore}
            className="mb-6 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-love-300 bg-white py-4 active:bg-love-100">
            {uploadingMore ? (
              <ActivityIndicator color="#c40b43" />
            ) : (
              <>
                <Ionicons name="add" size={22} color="#c40b43" />
                <Text
                  className="text-love-600 ml-2 text-base font-semibold"
                  style={{ fontFamily: 'Inter_600SemiBold' }}>
                  {isNew && pendingUris.length === 0 ? 'Adicionar fotos' : 'Adicionar mais'}
                </Text>
              </>
            )}
          </Pressable>

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
            className="mb-5 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
            style={{ fontFamily: 'Inter_400Regular' }}
          />

          <Text
            className="mb-1 text-sm text-gray-500"
            style={{ fontFamily: 'Inter_500Medium' }}>
            Local (opcional)
          </Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Onde rolou"
            className="mb-5 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
            style={{ fontFamily: 'Inter_400Regular' }}
          />

          <Text
            className="mb-1 text-sm text-gray-500"
            style={{ fontFamily: 'Inter_500Medium' }}>
            Legenda (opcional)
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="O que aconteceu"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="mb-6 min-h-[100px] rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
            style={{ fontFamily: 'Inter_400Regular' }}
          />

          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="mb-3 rounded-2xl bg-love-600 py-4 active:bg-love-700 disabled:opacity-50">
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className="text-center text-base font-semibold text-white"
                style={{ fontFamily: 'Inter_600SemiBold' }}>
                Salvar
              </Text>
            )}
          </Pressable>

          {!isNew && (
            <Pressable
              onPress={handleDeleteMemory}
              disabled={deleteMemory.isPending}
              className="mt-6 rounded-2xl border border-red-200 bg-white py-4 active:bg-red-50">
              <Text
                className="text-center text-base font-semibold text-red-600"
                style={{ fontFamily: 'Inter_600SemiBold' }}>
                Apagar memória
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
