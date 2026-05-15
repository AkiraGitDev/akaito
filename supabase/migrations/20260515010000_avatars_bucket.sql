-- ============================================================
-- Bucket de avatares + políticas de acesso
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode ler (bucket público)
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Usuário autenticado pode fazer upload
create policy "Authenticated can upload avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

-- Usuário autenticado pode sobrescrever
create policy "Authenticated can update avatars"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');

-- Usuário autenticado pode deletar
create policy "Authenticated can delete avatars"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars');
