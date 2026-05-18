import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/use-auth';

export type MediaType = 'movie' | 'series' | 'anime';
export type MediaStatus = 'want' | 'watching' | 'done';

export type Review = {
  id: string;
  media_id: string;
  user_id: string;
  rating: number | null;
  comment: string | null;
  finished_at: string | null;
  created_at: string | null;
};

export type Media = {
  id: string;
  title: string;
  type: MediaType;
  status: MediaStatus;
  cover_url: string | null;
  external_id: string | null;
  added_by: string | null;
  created_at: string | null;
  reviews: Review[];
};

async function fetchMediaList(): Promise<Media[]> {
  const { data, error } = await supabase
    .from('media')
    .select('id, title, type, status, cover_url, external_id, added_by, created_at, media_reviews(id, media_id, user_id, rating, comment, finished_at, created_at)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type as MediaType,
    status: row.status as MediaStatus,
    cover_url: row.cover_url,
    external_id: row.external_id,
    added_by: row.added_by,
    created_at: row.created_at,
    reviews: (row.media_reviews as Review[]) ?? [],
  }));
}

async function fetchMedia(id: string): Promise<Media | null> {
  const { data, error } = await supabase
    .from('media')
    .select('id, title, type, status, cover_url, external_id, added_by, created_at, media_reviews(id, media_id, user_id, rating, comment, finished_at, created_at)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    type: data.type as MediaType,
    status: data.status as MediaStatus,
    cover_url: data.cover_url,
    external_id: data.external_id,
    added_by: data.added_by,
    created_at: data.created_at,
    reviews: (data.media_reviews as Review[]) ?? [],
  };
}

export function useMediaList() {
  return useQuery({ queryKey: ['media'], queryFn: fetchMediaList });
}

export function useMedia(id: string | null) {
  return useQuery({
    queryKey: ['media', id],
    queryFn: () => fetchMedia(id!),
    enabled: !!id,
  });
}

type CreateInput = {
  title: string;
  type: MediaType;
  status: MediaStatus;
  cover_url?: string | null;
  external_id?: string | null;
};

export function useCreateMedia() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      if (!session) throw new Error('Sem sessão.');
      const { data, error } = await supabase
        .from('media')
        .insert({
          title: input.title,
          type: input.type,
          status: input.status,
          cover_url: input.cover_url ?? null,
          external_id: input.external_id ?? null,
          added_by: session.user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

type UpdateInput = {
  id: string;
  title?: string;
  type?: MediaType;
  status?: MediaStatus;
  cover_url?: string | null;
  external_id?: string | null;
};

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateInput) => {
      const { error } = await supabase.from('media').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['media'] });
      qc.invalidateQueries({ queryKey: ['media', vars.id] });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

type ReviewInput = {
  media_id: string;
  rating: number | null;
  comment: string | null;
  finished_at: string | null;
};

export function useUpsertReview() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      if (!session) throw new Error('Sem sessão.');
      const { error } = await supabase
        .from('media_reviews')
        .upsert(
          {
            media_id: input.media_id,
            user_id: session.user.id,
            rating: input.rating,
            comment: input.comment,
            finished_at: input.finished_at,
          },
          { onConflict: 'media_id,user_id' },
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['media'] });
      qc.invalidateQueries({ queryKey: ['media', vars.media_id] });
    },
  });
}

export function useDeleteReview() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      if (!session) throw new Error('Sem sessão.');
      const { error } = await supabase
        .from('media_reviews')
        .delete()
        .eq('media_id', mediaId)
        .eq('user_id', session.user.id);
      if (error) throw error;
    },
    onSuccess: (_, mediaId) => {
      qc.invalidateQueries({ queryKey: ['media'] });
      qc.invalidateQueries({ queryKey: ['media', mediaId] });
    },
  });
}

export const TYPE_EMOJI: Record<MediaType, string> = {
  movie: '🎬',
  series: '📺',
  anime: '🎌',
};

export const TYPE_LABEL: Record<MediaType, string> = {
  movie: 'Filme',
  series: 'Série',
  anime: 'Anime',
};

export const STATUS_LABEL: Record<MediaStatus, string> = {
  want: 'Queremos',
  watching: 'Vendo',
  done: 'Visto',
};
