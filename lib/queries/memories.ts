import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/use-auth';

export type MemoryPhoto = {
  id: string;
  memory_id: string;
  storage_path: string;
  position: number;
  public_url: string;
};

export type Memory = {
  id: string;
  memory_date: string;
  caption: string | null;
  location_name: string | null;
  created_by: string | null;
  created_at: string | null;
  photos: MemoryPhoto[];
};

function withPublicUrls(rows: Array<Omit<MemoryPhoto, 'public_url'>>): MemoryPhoto[] {
  return rows.map((row) => ({
    ...row,
    public_url: supabase.storage.from('memories').getPublicUrl(row.storage_path).data.publicUrl,
  }));
}

async function fetchMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('memories')
    .select('id, memory_date, caption, location_name, created_by, created_at, memory_photos(id, memory_id, storage_path, position)')
    .order('memory_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    memory_date: row.memory_date,
    caption: row.caption,
    location_name: row.location_name,
    created_by: row.created_by,
    created_at: row.created_at,
    photos: withPublicUrls(
      ((row.memory_photos as Array<Omit<MemoryPhoto, 'public_url'>>) ?? []).sort(
        (a, b) => a.position - b.position,
      ),
    ),
  }));
}

async function fetchMemory(id: string): Promise<Memory | null> {
  const { data, error } = await supabase
    .from('memories')
    .select('id, memory_date, caption, location_name, created_by, created_at, memory_photos(id, memory_id, storage_path, position)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    memory_date: data.memory_date,
    caption: data.caption,
    location_name: data.location_name,
    created_by: data.created_by,
    created_at: data.created_at,
    photos: withPublicUrls(
      ((data.memory_photos as Array<Omit<MemoryPhoto, 'public_url'>>) ?? []).sort(
        (a, b) => a.position - b.position,
      ),
    ),
  };
}

export function useMemories() {
  return useQuery({ queryKey: ['memories'], queryFn: fetchMemories });
}

export function useMemory(id: string | null) {
  return useQuery({
    queryKey: ['memories', id],
    queryFn: () => fetchMemory(id!),
    enabled: !!id,
  });
}

async function uploadPhotoToBucket(memoryId: string, localUri: string, position: number) {
  const ext = (localUri.split('.').pop() ?? 'jpg').toLowerCase().split('?')[0] ?? 'jpg';
  const path = `${memoryId}/${Date.now()}_${position}.${ext}`;
  const response = await fetch(localUri);
  const buffer = await response.arrayBuffer();
  const { error } = await supabase.storage.from('memories').upload(path, buffer, {
    contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

type CreateInput = {
  memory_date: string;
  caption?: string | null;
  location_name?: string | null;
  photoUris: string[];
};

export function useCreateMemory() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      if (!session) throw new Error('Sem sessão.');
      const { data: memory, error: memErr } = await supabase
        .from('memories')
        .insert({
          memory_date: input.memory_date,
          caption: input.caption ?? null,
          location_name: input.location_name ?? null,
          created_by: session.user.id,
        })
        .select()
        .single();
      if (memErr) throw memErr;

      for (let i = 0; i < input.photoUris.length; i++) {
        const path = await uploadPhotoToBucket(memory.id, input.photoUris[i]!, i);
        const { error: photoErr } = await supabase
          .from('memory_photos')
          .insert({ memory_id: memory.id, storage_path: path, position: i });
        if (photoErr) throw photoErr;
      }
      return memory.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}

type UpdateInput = {
  id: string;
  memory_date?: string;
  caption?: string | null;
  location_name?: string | null;
};

export function useUpdateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: UpdateInput) => {
      const { error } = await supabase.from('memories').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['memories'] });
      qc.invalidateQueries({ queryKey: ['memories', vars.id] });
    },
  });
}

export function useAddPhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { memoryId: string; photoUris: string[]; startPosition: number }) => {
      for (let i = 0; i < input.photoUris.length; i++) {
        const position = input.startPosition + i;
        const path = await uploadPhotoToBucket(input.memoryId, input.photoUris[i]!, position);
        const { error } = await supabase
          .from('memory_photos')
          .insert({ memory_id: input.memoryId, storage_path: path, position });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['memories'] });
      qc.invalidateQueries({ queryKey: ['memories', vars.memoryId] });
    },
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: { id: string; storage_path: string; memory_id: string }) => {
      await supabase.storage.from('memories').remove([photo.storage_path]);
      const { error } = await supabase.from('memory_photos').delete().eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['memories'] });
      qc.invalidateQueries({ queryKey: ['memories', vars.memory_id] });
    },
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: photos } = await supabase
        .from('memory_photos')
        .select('storage_path')
        .eq('memory_id', id);
      const paths = (photos ?? []).map((p) => p.storage_path);
      if (paths.length > 0) {
        await supabase.storage.from('memories').remove(paths);
      }
      const { error } = await supabase.from('memories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memories'] });
    },
  });
}
