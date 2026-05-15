# CLAUDE.md

Este arquivo orienta Claude (e outros assistentes de IA) ao trabalhar neste repositório.

---

## Contexto do Projeto

App pessoal para casal — usado **apenas por duas pessoas**: eu e minha namorada. Não há fluxo de cadastro público, não há multi-tenancy, não há crescimento previsto além desses dois usuários. Otimize sempre para **simplicidade e prazer de uso**, nunca para escala.

Implicações práticas dessa restrição:
- IDs dos dois usuários podem ser hardcoded em variáveis de ambiente.
- Não precisa de fluxo de "pareamento" — o vínculo do casal já existe por definição.
- Não precisa de telas de onboarding complexas, recuperação de senha social, convites etc.
- Validações pesadas, rate limits e proteções contra abuso são desnecessárias.
- Se a escolha for entre "código mais simples" e "código mais genérico", **sempre simples**.

---

## Stack

**Frontend (mobile)**
- **Expo (React Native)** com TypeScript
- **Expo Router** para navegação (file-based routing)
- **NativeWind** (Tailwind para RN) para estilos
- **Zustand** para state global (UI state, sessão)
- **TanStack Query** para cache e sincronização com backend
- **@react-native-async-storage/async-storage** para storage local (compatível com Expo Go e web — performance suficiente pro app)
- **expo-notifications** para push
- **expo-image-picker** + **expo-image** para fotos
- **date-fns** para manipulação de datas (não usar moment)

**Backend**
- **Supabase**: Postgres + Auth + Realtime + Storage + Edge Functions
- Auth via **magic link por e-mail** (uma vez só, dois usuários)
- **Row Level Security (RLS)** habilitado em todas as tabelas, mesmo sendo só dois usuários — disciplina importa.

**Outras**
- **Expo Push Service** para notifications (não usar FCM/APNs direto)
- **EAS Build** quando for hora de gerar binários

---

## Estrutura de Pastas

```
/app                  # Telas (Expo Router)
  /(tabs)
    index.tsx         # Home: contador, próximo countdown, pergunta do dia
    memories.tsx
    media.tsx         # filmes, séries, animes, podcasts...
    places.tsx
    stats.tsx
  /memory/[id].tsx
  /media/[id].tsx
  /place/[id].tsx
/components           # Componentes reutilizáveis
  /ui                 # Componentes base (Button, Card, Input...)
  /features           # Componentes específicos de feature
/lib
  /supabase.ts        # Cliente Supabase
  /push.ts            # Setup de push notifications
  /queries            # TanStack Query hooks
  /utils
/stores               # Zustand stores
/types                # Tipos TypeScript compartilhados
/supabase
  /migrations         # SQL migrations versionadas
  /functions          # Edge Functions
/assets
```

---

## Convenções de Código

- **TypeScript strict**. Nada de `any` sem comentário justificando.
- Componentes em **PascalCase**, hooks em **camelCase com prefixo `use`**, arquivos de tela em lowercase (Expo Router).
- Sem default exports exceto onde o framework exige (telas do Expo Router).
- Imports absolutos com alias `@/` configurado no `tsconfig`.
- Estilos via NativeWind (`className`). Cair pra StyleSheet só quando necessário.
- Datas sempre em UTC no banco, formatadas no client com timezone do usuário.
- Nunca commitar `.env`. Usar `expo-constants` pra ler env vars.

---

## Schema do Banco (Supabase / Postgres)

```sql
-- Casal (linha única, configura uma vez)
couple (
  id uuid primary key default gen_random_uuid(),
  started_at date not null,           -- data de início do namoro
  created_at timestamptz default now()
)

-- Perfil de cada um dos dois
profiles (
  id uuid primary key references auth.users(id),
  name text not null,
  avatar_url text,
  birthday date,
  expo_push_token text,
  created_at timestamptz default now()
)

-- Memórias (fotos de momentos)
memories (
  id uuid primary key default gen_random_uuid(),
  memory_date date not null,          -- data DO MOMENTO, não do upload
  caption text,
  location_name text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
)

memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid references memories(id) on delete cascade,
  storage_path text not null,         -- path no Supabase Storage
  position int default 0
)

-- Countdowns
countdowns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target_date date not null,
  emoji text,
  notify_days_before int[] default '{7,3,1,0}',
  created_at timestamptz default now()
)

-- Perguntas diárias
daily_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  category text                       -- 'sobre_voce', 'sobre_nos', 'hipotetico'...
)

daily_assignments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references daily_questions(id),
  assigned_date date not null unique  -- uma pergunta por dia
)

daily_answers (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references daily_assignments(id),
  user_id uuid references profiles(id),
  answer text not null,
  created_at timestamptz default now(),
  unique(assignment_id, user_id)      -- um por usuário por dia
)

-- Streak do casal (linha única)
streak (
  id uuid primary key default gen_random_uuid(),
  current_count int default 0,
  longest_count int default 0,
  last_complete_date date
)

-- Lugares (restaurantes, eventos, shows...)
places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'restaurant',  -- 'restaurant', 'event', 'other'
  category text,                            -- ex: 'italiana', 'show', 'cinema'
  address text,
  latitude numeric,
  longitude numeric,
  visited_at date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
)

place_reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  user_id uuid references profiles(id),
  rating_quality int check (rating_quality between 0 and 5),    -- comida / qualidade do evento
  rating_ambience int check (rating_ambience between 0 and 5),  -- ambiente
  rating_value int check (rating_value between 0 and 5),        -- custo-benefício
  comment text,
  would_return boolean,
  created_at timestamptz default now(),
  unique(place_id, user_id)
)

-- Mídia (filmes, séries, animes, podcasts, livros...)
media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,                       -- 'movie', 'series', 'anime', 'podcast', 'book', 'other'
  status text not null default 'want',      -- 'want', 'watching', 'done'
  cover_url text,
  external_id text,                         -- opcional: TMDB/IMDb/AniList id
  added_by uuid references profiles(id),
  created_at timestamptz default now()
)

media_reviews (
  id uuid primary key default gen_random_uuid(),
  media_id uuid references media(id) on delete cascade,
  user_id uuid references profiles(id),
  rating int check (rating between 0 and 5),
  comment text,
  finished_at date,
  created_at timestamptz default now(),
  unique(media_id, user_id)
)
```

**RLS**: políticas simples — usuário autenticado pode ler/escrever tudo. Não precisa segmentar por casal porque só existe um casal.

---

## Features (Especificações)

### 1. Contador de dias juntos + Perfil
- Tela inicial mostra **número grande** de dias desde `couple.started_at`.
- Marca milestones especiais (100, 365, 500, 1000 dias, anos completos).
- Perfis dos dois lado a lado com foto, nome e idade calculada.
- Editar perfil: nome, foto, aniversário.

### 2. Galeria / Memórias
- Cada memória tem **data própria** (`memory_date`), permitindo registrar momentos antigos.
- Uma memória pode ter múltiplas fotos (`memory_photos`).
- Upload via `expo-image-picker` → Supabase Storage (bucket `memories`).
- Comprimir imagens client-side antes do upload (qualidade 0.7, max 2000px).
- Visualizações:
  - **Timeline** (lista cronológica reversa)
  - **Calendário** (heatmap dos dias com memórias)
  - **Mapa** (pins onde memórias têm coordenadas)
- Cada memória tem: caption, local opcional, data, fotos.

### 3. Push Notifications
- Setup via `expo-notifications`. Salvar token em `profiles.expo_push_token`.
- Eventos que disparam notificação **pro outro**:
  - Parceiro respondeu a pergunta do dia (sem revelar a resposta)
  - Nova memória adicionada
  - Novo lugar adicionado
  - Nova mídia adicionada na lista "pra ver"
  - Countdown se aproximando (N dias antes, conforme `notify_days_before`)
- Send via Edge Function chamando Expo Push API.
- **Nunca** notificar a si mesmo.

### 4. Countdowns
- Lista de eventos futuros ordenados pelo mais próximo.
- Cada item mostra: emoji, título, dias restantes.
- Tela inicial destaca o próximo.
- Cron job (Edge Function agendada) roda diariamente e envia push pros dias configurados.
- CRUD simples: criar, editar, deletar.

### 5. Perguntas Diárias + Streak (foguinho 🔥)
- Pool de perguntas pré-cadastradas em `daily_questions` (seed inicial com ~200 perguntas).
- A cada dia, uma pergunta é atribuída via `daily_assignments` (criada lazy quando alguém abre a tela).
- Fluxo:
  1. Usuário vê a pergunta do dia.
  2. Escreve sua resposta. **Não vê a do outro ainda.**
  3. Quando os dois respondem, libera visualização mútua.
- **Streak**:
  - Conta dias consecutivos em que **ambos** responderam.
  - Quebra se passar um dia sem os dois responderem.
  - Exibir ícone 🔥 com número grande quando ativa.
  - Trocar pra ❄️ ou apagado quando quebrada.
- Notificar o parceiro quando você responder ("seu amor respondeu a pergunta do dia 💌").
- Permitir browse de perguntas/respostas passadas.

### 6. Lugares (restaurantes, eventos, shows) + reviews
- Adicionar lugar: nome, tipo (`restaurant` / `event` / `other`), categoria livre (ex: "italiana", "show"), endereço opcional (autocomplete via Places API opcional), data da visita.
- Cada um faz seu review individualmente:
  - Nota qualidade (0–5) — comida no restaurante, qualidade do evento
  - Nota ambiente (0–5)
  - Nota custo-benefício (0–5)
  - Comentário livre
  - "Voltaria?" (sim/não)
- Visão do lugar mostra os **dois reviews lado a lado** + **médias por categoria** + **média geral** (média das 6 notas: 2 pessoas × 3 categorias).
- Listagem com filtros: melhores avaliados, mais recentes, "queremos voltar", por tipo (restaurante / evento).
- Visão de mapa opcional.

### 7. Pra ver — filmes, séries, animes, podcasts
- Lista compartilhada de mídia que vocês querem consumir / estão consumindo / já consumiram.
- Adicionar item: título, tipo (`movie`, `series`, `anime`, `podcast`, `book`, `other`), capa opcional, status inicial (default `want`).
- Status muda manualmente: `want` → `watching` → `done`.
- Quando alguém marca como `done` (ou em qualquer momento), pode adicionar **review individual**:
  - Nota 0–5
  - Comentário livre
  - Data em que terminou
- Visão do item mostra os dois reviews lado a lado + média.
- Listagem com filtros por status e por tipo. Aba "queremos ver" destacada.
- Notificar o parceiro quando adicionar item novo na lista.
- Integração com TMDB / AniList / etc. é **opcional** — V1 aceita entrada manual; `external_id` e `cover_url` ficam disponíveis pra usar depois.

### 8. Estatísticas do relacionamento
Dashboard com cards:
- Dias juntos
- Total de memórias
- Mês com mais memórias
- Streak atual e maior streak histórica
- Total de perguntas respondidas
- Total de lugares visitados
- Top 5 lugares (por média geral)
- Distância total entre lugares (se tiver coords) — "viajamos X km juntos"
- Distribuição de respostas por categoria de pergunta
- Total de mídias consumidas (e por tipo)
- Top 5 mídias (por média dos dois)

Tudo via queries SQL diretas. Cachear via TanStack Query com `staleTime` alto (15min).

---

## Comandos

```bash
# Dev
npx expo start                  # inicia bundler
npx expo start --ios            # abre simulador iOS
npx expo start --android        # abre emulador Android

# Type check
npx tsc --noEmit

# Supabase
npx supabase start              # local dev (Docker)
npx supabase db push            # aplica migrations no remoto
npx supabase gen types typescript --local > types/supabase.ts

# Build
eas build --platform ios --profile development
eas build --platform android --profile development
```

---

## Diretrizes para Claude

Quando me ajudar neste projeto:

1. **Não generalize.** É um app pra duas pessoas. Não invente abstrações pra suportar N casais, autenticação social complexa, ou casos extremos. Se eu pedir algo que parece over-engineered, questione.
2. **Prefira SQL direto a ORMs.** Supabase client com queries explícitas. Não traga Prisma, Drizzle etc.
3. **Sempre TypeScript.** Tipos gerados do Supabase (`types/supabase.ts`) são a fonte da verdade pro schema.
4. **Componentes pequenos e específicos.** Nada de "componente genérico que faz tudo".
5. **Não adicione dependências sem perguntar.** O stack acima é proposital. Cada lib nova é uma dívida.
6. **Migrations versionadas.** Toda mudança no banco vai como arquivo `.sql` em `/supabase/migrations` com timestamp.
7. **Idioma**: código em inglês (variáveis, funções, comentários), UI em **português do Brasil**.
8. **Datas e timezones**: armazenar em UTC, exibir no fuso local. Usar `date-fns-tz` se precisar de conversão explícita.
9. **Erros visíveis**: durante dev, mostre erros no client. Não esconda com `catch` silencioso.
10. **Performance não é prioridade neste MVP** — clareza é. Não otimize antes de medir.

---

## Roadmap (ordem sugerida)

1. ✅ Setup do Expo + Supabase + auth + perfis
2. ✅ Contador de dias + tela inicial
3. ✅ Memórias (galeria + upload)
4. ✅ Countdowns
5. ✅ Push notifications (infra base)
6. ✅ Perguntas diárias + streak
7. ✅ Lugares + reviews
8. ✅ Pra ver (filmes, séries, animes, podcasts)
9. ✅ Estatísticas

Cada feature deve ser entregue **inteira** antes de partir pra próxima (incluindo UI, banco, queries e push se aplicável).

---

## Notas Pessoais (preencher depois)

- Data de início do namoro: `17-01-2025`
- Aniversário dela: `03-02-2007`
- Meu aniversário: `12-02-2001`
- Lugares favoritos pra começar o catálogo:
- Apelidos que aparecem na UI:
