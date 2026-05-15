import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/use-auth';

export type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  birthday: string | null;
  expo_push_token: string | null;
  created_at: string | null;
};

async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data ?? [];
}

export function useAllProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: fetchAllProfiles,
  });
}

export function useMyProfile() {
  const { session } = useAuth();
  const myId = session?.user.id;
  const { data, ...rest } = useAllProfiles();
  return {
    ...rest,
    data: myId ? (data?.find((p) => p.id === myId) ?? null) : null,
  };
}

export function usePartnerProfile() {
  const { session } = useAuth();
  const myId = session?.user.id;
  const { data, ...rest } = useAllProfiles();
  return {
    ...rest,
    data: myId ? (data?.find((p) => p.id !== myId) ?? null) : null,
  };
}

type UpdateInput = {
  name?: string;
  birthday?: string | null;
  avatar_url?: string | null;
};

export function useUpdateProfile() {
  const { session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateInput) => {
      if (!session) throw new Error('Sem sessão.');
      const { data, error } = await supabase
        .from('profiles')
        .update(input)
        .eq('id', session.user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}
