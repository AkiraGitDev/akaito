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
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import {
  STATUS_LABEL,
  TYPE_EMOJI,
  TYPE_LABEL,
  type MediaStatus,
  type MediaType,
  useCreateMedia,
  useDeleteMedia,
  useDeleteReview,
  useMedia,
  useUpdateMedia,
  useUpsertReview,
} from '@/lib/queries/media';
import { isTmdbConfigured, searchTmdb, type TmdbHit } from '@/lib/tmdb';
import { useAuth } from '@/lib/use-auth';
import { formatBRDate, maskBRDate, parseBRDate } from '@/lib/utils/dates';
import { confirmDestructive } from '@/lib/utils/confirm';

const TYPES: MediaType[] = ['movie', 'series', 'anime'];
const STATUSES: MediaStatus[] = ['want', 'watching', 'done'];

function tmdbKindFor(type: MediaType): 'movie' | 'tv' {
  return type === 'movie' ? 'movie' : 'tv';
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(value === star ? 0 : star)}
            className="active:opacity-60">
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={32}
              color={filled ? '#fb3565' : '#cbd5e1'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function TmdbHitCard({ hit, onPress }: { hit: TmdbHit; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="w-28 active:opacity-70"
      style={{ marginRight: 12 }}>
      {hit.poster_url ? (
        <Image
          source={{ uri: hit.poster_url }}
          style={{ width: 112, height: 168, borderRadius: 10 }}
          contentFit="cover"
        />
      ) : (
        <View
          className="items-center justify-center rounded-xl bg-love-100"
          style={{ width: 112, height: 168 }}>
          <Text className="text-4xl">🎞️</Text>
        </View>
      )}
      <Text
        className="text-love-700 mt-2 text-xs"
        style={{ fontFamily: 'Inter_600SemiBold' }}
        numberOfLines={2}>
        {hit.title}
      </Text>
      {hit.year && (
        <Text
          className="text-xs text-gray-500"
          style={{ fontFamily: 'Inter_400Regular' }}>
          {hit.year}
        </Text>
      )}
    </Pressable>
  );
}

export default function MediaForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const { session } = useAuth();

  const { data: existing, isLoading } = useMedia(isNew ? null : id);
  const createMedia = useCreateMedia();
  const updateMedia = useUpdateMedia();
  const deleteMedia = useDeleteMedia();
  const upsertReview = useUpsertReview();
  const deleteReview = useDeleteReview();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('movie');
  const [status, setStatus] = useState<MediaStatus>('want');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [externalId, setExternalId] = useState<string | null>(null);
  const [hideResults, setHideResults] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [finishedAt, setFinishedAt] = useState('');

  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setType(existing.type);
      setStatus(existing.status);
      setCoverUrl(existing.cover_url);
      setExternalId(existing.external_id);
      const myReview = existing.reviews.find((r) => r.user_id === session?.user.id);
      if (myReview) {
        setRating(myReview.rating ?? 0);
        setComment(myReview.comment ?? '');
        setFinishedAt(formatBRDate(myReview.finished_at));
      }
    }
  }, [existing, session?.user.id]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(title), 400);
    return () => clearTimeout(handle);
  }, [title]);

  const { data: hits = [], isFetching: searching } = useQuery({
    queryKey: ['tmdb', tmdbKindFor(type), debouncedQuery],
    queryFn: () => searchTmdb(debouncedQuery, tmdbKindFor(type)),
    enabled: !hideResults && debouncedQuery.trim().length >= 2 && isTmdbConfigured(),
    staleTime: 1000 * 60 * 10,
  });

  function handleChangeTitle(v: string) {
    setTitle(v);
    setHideResults(false);
  }

  function handlePickHit(hit: TmdbHit) {
    setTitle(hit.title);
    setCoverUrl(hit.poster_url);
    setExternalId(String(hit.id));
    setHideResults(true);
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Ops', 'Coloca um título.');
      return;
    }
    try {
      if (isNew) {
        await createMedia.mutateAsync({
          title: title.trim(),
          type,
          status,
          cover_url: coverUrl,
          external_id: externalId,
        });
      } else if (id) {
        await updateMedia.mutateAsync({
          id,
          title: title.trim(),
          type,
          status,
          cover_url: coverUrl,
          external_id: externalId,
        });
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message ?? 'Tenta de novo.');
    }
  }

  async function handleSaveReview() {
    if (isNew || !id) return;
    let finishedIso: string | null = null;
    if (finishedAt.trim()) {
      finishedIso = parseBRDate(finishedAt.trim());
      if (!finishedIso) {
        Alert.alert('Ops', 'Data inválida. Use DD/MM/AAAA.');
        return;
      }
    }
    try {
      await upsertReview.mutateAsync({
        media_id: id,
        rating: rating > 0 ? rating : null,
        comment: comment.trim() || null,
        finished_at: finishedIso,
      });
      Alert.alert('💖', 'Avaliação salva.');
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message ?? 'Tenta de novo.');
    }
  }

  async function handleDeleteReview() {
    if (isNew || !id) return;
    const ok = await confirmDestructive('Apagar avaliação', 'Tem certeza?');
    if (!ok) return;
    try {
      await deleteReview.mutateAsync(id);
      setRating(0);
      setComment('');
      setFinishedAt('');
    } catch (e: any) {
      Alert.alert('Erro ao apagar', e.message ?? 'Tenta de novo.');
    }
  }

  async function handleDeleteMedia() {
    if (isNew || !id) return;
    const ok = await confirmDestructive(
      'Apagar item',
      'Vai apagar todas as avaliações junto. Tem certeza?',
    );
    if (!ok) return;
    try {
      await deleteMedia.mutateAsync(id);
      router.back();
    } catch (e: any) {
      Alert.alert('Erro ao apagar', e.message ?? 'Tenta de novo.');
    }
  }

  function handleClearCover() {
    setCoverUrl(null);
    setExternalId(null);
  }

  const saving = createMedia.isPending || updateMedia.isPending;
  const myReview = existing?.reviews.find((r) => r.user_id === session?.user.id);
  const hasMyReview = !!myReview;
  const tmdbReady = isTmdbConfigured();
  const showResults = !hideResults && debouncedQuery.trim().length >= 2;

  if (!isNew && isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-love-50">
        <ActivityIndicator color="#c40b43" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-love-50" edges={['bottom']}>
      <Stack.Screen options={{ title: isNew ? 'Adicionar' : title || 'Item' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled">
          <View className="mb-6 items-center">
            <View className="relative">
              {coverUrl ? (
                <Image
                  source={{ uri: coverUrl }}
                  style={{ width: 140, height: 200, borderRadius: 16 }}
                  contentFit="cover"
                />
              ) : (
                <View
                  className="items-center justify-center rounded-2xl bg-love-100"
                  style={{ width: 140, height: 200 }}>
                  <Text className="text-6xl">{TYPE_EMOJI[type]}</Text>
                </View>
              )}
              {coverUrl && (
                <Pressable
                  onPress={handleClearCover}
                  className="absolute -right-2 -top-2 h-8 w-8 items-center justify-center rounded-full bg-red-600">
                  <Ionicons name="close" size={18} color="white" />
                </Pressable>
              )}
            </View>
          </View>

          <Text
            className="mb-2 text-sm text-gray-500"
            style={{ fontFamily: 'Inter_500Medium' }}>
            Tipo
          </Text>
          <View className="mb-5 flex-row gap-2">
            {TYPES.map((t) => {
              const selected = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  className={`flex-row items-center rounded-full px-4 py-2 ${
                    selected ? 'bg-love-600' : 'bg-white border border-love-200'
                  }`}>
                  <Text className="mr-1.5 text-base">{TYPE_EMOJI[t]}</Text>
                  <Text
                    className={selected ? 'text-white' : 'text-love-700'}
                    style={{ fontFamily: 'Inter_500Medium' }}>
                    {TYPE_LABEL[t]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            className="mb-1 text-sm text-gray-500"
            style={{ fontFamily: 'Inter_500Medium' }}>
            Título {tmdbReady && '(digita pra buscar capa)'}
          </Text>
          <TextInput
            value={title}
            onChangeText={handleChangeTitle}
            placeholder={tmdbReady ? 'Busca por título...' : 'Título'}
            className="mb-3 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
            style={{ fontFamily: 'Inter_400Regular' }}
          />

          {!tmdbReady && (
            <Text
              className="mb-5 text-xs text-gray-400"
              style={{ fontFamily: 'Inter_400Regular' }}>
              Configure EXPO_PUBLIC_TMDB_TOKEN no .env pra buscar capas.
            </Text>
          )}

          {showResults && (
            <View className="mb-5">
              {searching ? (
                <View className="items-center py-6">
                  <ActivityIndicator color="#c40b43" />
                </View>
              ) : hits.length === 0 ? (
                <Text
                  className="py-4 text-center text-sm text-gray-400"
                  style={{ fontFamily: 'Inter_400Regular' }}>
                  Nada encontrado.
                </Text>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerClassName="py-2">
                  {hits.map((hit) => (
                    <TmdbHitCard
                      key={`${hit.id}-${hit.title}`}
                      hit={hit}
                      onPress={() => handlePickHit(hit)}
                    />
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <Text
            className="mb-2 text-sm text-gray-500"
            style={{ fontFamily: 'Inter_500Medium' }}>
            Status
          </Text>
          <View className="mb-6 flex-row gap-2">
            {STATUSES.map((s) => {
              const selected = status === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  className={`flex-1 items-center rounded-2xl py-3 ${
                    selected ? 'bg-love-600' : 'bg-white border border-love-200'
                  }`}>
                  <Text
                    className={selected ? 'text-white' : 'text-love-700'}
                    style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {STATUS_LABEL[s]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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
            <>
              <View className="mt-10 mb-4 h-px bg-love-200" />
              <Text
                className="text-love-700 mb-4 text-2xl"
                style={{ fontFamily: 'DMSerifDisplay_400Regular' }}>
                Sua avaliação
              </Text>

              <Text
                className="mb-2 text-sm text-gray-500"
                style={{ fontFamily: 'Inter_500Medium' }}>
                Nota
              </Text>
              <View className="mb-5">
                <StarPicker value={rating} onChange={setRating} />
              </View>

              <Text
                className="mb-1 text-sm text-gray-500"
                style={{ fontFamily: 'Inter_500Medium' }}>
                Terminei em (opcional)
              </Text>
              <TextInput
                value={finishedAt}
                onChangeText={(v) => setFinishedAt(maskBRDate(v))}
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                maxLength={10}
                className="mb-5 rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
                style={{ fontFamily: 'Inter_400Regular' }}
              />

              <Text
                className="mb-1 text-sm text-gray-500"
                style={{ fontFamily: 'Inter_500Medium' }}>
                Comentário (opcional)
              </Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="O que achou"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="mb-6 min-h-[80px] rounded-2xl border border-love-200 bg-white px-5 py-4 text-base"
                style={{ fontFamily: 'Inter_400Regular' }}
              />

              <Pressable
                onPress={handleSaveReview}
                disabled={upsertReview.isPending}
                className="mb-3 rounded-2xl bg-love-600 py-4 active:bg-love-700 disabled:opacity-50">
                {upsertReview.isPending ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className="text-center text-base font-semibold text-white"
                    style={{ fontFamily: 'Inter_600SemiBold' }}>
                    Salvar avaliação
                  </Text>
                )}
              </Pressable>

              {hasMyReview && (
                <Pressable
                  onPress={handleDeleteReview}
                  className="mb-3 rounded-2xl border border-love-200 bg-white py-3 active:bg-love-50">
                  <Text
                    className="text-love-600 text-center text-sm"
                    style={{ fontFamily: 'Inter_500Medium' }}>
                    Apagar avaliação
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleDeleteMedia}
                disabled={deleteMedia.isPending}
                className="mt-8 rounded-2xl border border-red-200 bg-white py-4 active:bg-red-50">
                <Text
                  className="text-center text-base font-semibold text-red-600"
                  style={{ fontFamily: 'Inter_600SemiBold' }}>
                  Apagar item
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
