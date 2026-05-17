-- ============================================================
-- Bucket de fotos de memórias + políticas de acesso
-- ============================================================

insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode ler (bucket público — apenas o casal acessa o app)
create policy "Memories are publicly readable"
  on storage.objects for select
  using (bucket_id = 'memories');

-- Usuário autenticado pode fazer upload
create policy "Authenticated can upload memories"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'memories');

-- Usuário autenticado pode sobrescrever
create policy "Authenticated can update memories"
  on storage.objects for update to authenticated
  using (bucket_id = 'memories');

-- Usuário autenticado pode deletar
create policy "Authenticated can delete memories"
  on storage.objects for delete to authenticated
  using (bucket_id = 'memories');
