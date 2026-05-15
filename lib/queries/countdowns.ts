import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type Countdown = {
  id: string;
  title: string;
  target_date: string;
  emoji: string | null;
  notify_days_before: number[] | null;
  created_at: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

async function fetchCountdowns(): Promise<Countdown[]> {
  const { data, error } = await supabase
    .from('countdowns')
    .select('*')
    .gte('target_date', today())
    .order('target_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useCountdowns() {
  return useQuery({
    queryKey: ['countdowns'],
    queryFn: fetchCountdowns,
  });
}

export function useNextCountdown() {
  const { data, ...rest } = useCountdowns();
  return { ...rest, data: data?.[0] ?? null };
}

async function fetchCountdown(id: string): Promise<Countdown | null> {
  const { data, error } = await supabase
    .from('countdowns')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function useCountdown(id: string | null) {
  return useQuery({
    queryKey: ['countdown', id],
    queryFn: () => fetchCountdown(id!),
    enabled: !!id && id !== 'new',
  });
}

type CountdownInput = {
  title: string;
  target_date: string;
  emoji: string | null;
};

export function useCreateCountdown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CountdownInput) => {
      const { data, error } = await supabase
        .from('countdowns')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['countdowns'] });
    },
  });
}

export function useUpdateCountdown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CountdownInput & { id: string }) => {
      const { data, error } = await supabase
        .from('countdowns')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['countdowns'] });
      qc.invalidateQueries({ queryKey: ['countdown', vars.id] });
    },
  });
}

export function useDeleteCountdown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('countdowns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['countdowns'] });
    },
  });
}
