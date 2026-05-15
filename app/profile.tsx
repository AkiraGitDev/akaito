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
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/use-auth';
import { useMyProfile, useUpdateProfile, useUploadAvatar } from '@/lib/queries/profiles';
import { formatBRDate, maskBRDate, parseBRDate } from '@/lib/utils/dates';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { data: profile, isLoading } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setBirthday(formatBRDate(profile.birthday));
    }
  }, [profile]);

  async function handlePickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Sem permissão', 'Preciso de acesso às fotos pra você escolher um avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    try {
      await uploadAvatar.mutateAsync(asset.uri);
    } catch (e: any) {
      Alert.alert('Erro ao enviar foto', e.message ?? 'Tenta de novo.');
    }
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Ops', 'Coloca seu nome.');
      return;
    }
    let birthdayIso: string | null = null;
    if (birthday.trim()) {
      birthdayIso = parseBRDate(birthday.trim());
      if (!birthdayIso) {
        Alert.alert('Ops', 'Data de aniversário inválida. Use DD/MM/AAAA.');
        return;
      }
    }
    try {
      await updateProfile.mutateAsync({ name: trimmedName, birthday: birthdayIso });
      Alert.alert('💖', 'Perfil salvo.');
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message ?? 'Tenta de novo.');
    }
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }

  const avatarUrl = profile?.avatar_url ?? null;
  const initials = initialsOf(name || profile?.name || '');

  return (
    <SafeAreaView className="flex-1 bg-love-50">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Perfil',
          headerStyle: { backgroundColor: '#fff1f3' },
          headerTintColor: '#c40b43',
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 py-8"
          keyboardShouldPersistTaps="handled">
          {isLoading ? (
            <ActivityIndicator color="#c40b43" />
          ) : (
            <>
              <View className="mb-8 items-center">
                <Pressable onPress={handlePickAvatar} disabled={uploadAvatar.isPending}>
                  <View className="h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-love-300 bg-love-200">
                    {avatarUrl ? (
                      <Image
                        source={{ uri: avatarUrl }}
                        style={{ width: 128, height: 128 }}
                        contentFit="cover"
                      />
                    ) : (
                      <Text className="text-love-700 text-4xl font-bold">{initials}</Text>
                    )}
                    {uploadAvatar.isPending && (
                      <View className="absolute inset-0 items-center justify-center bg-black/40">
                        <ActivityIndicator color="white" />
                      </View>
                    )}
                  </View>
                </Pressable>
                <Text className="text-love-600 mt-2 text-sm">Trocar foto</Text>
              </View>

              <Text className="mb-1 text-sm text-gray-500">E-mail</Text>
              <Text className="mb-6 text-base text-gray-800">{session?.user.email}</Text>

              <Text className="mb-1 text-sm text-gray-500">Nome</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                className="mb-5 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
              />

              <Text className="mb-1 text-sm text-gray-500">Aniversário</Text>
              <TextInput
                value={birthday}
                onChangeText={(v) => setBirthday(maskBRDate(v))}
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                maxLength={10}
                className="mb-8 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
              />

              <Pressable
                onPress={handleSave}
                disabled={updateProfile.isPending}
                className="mb-3 rounded-2xl bg-love-600 py-4 active:bg-love-700 disabled:opacity-50">
                {updateProfile.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center text-base font-semibold text-white">Salvar</Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleLogout}
                className="mt-8 rounded-2xl border border-red-200 bg-white py-4 active:bg-red-50">
                <Text className="text-center text-base font-semibold text-red-600">Sair</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
