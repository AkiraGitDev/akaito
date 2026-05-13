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
- **react-native-mmkv** para storage local (rápido, síncrono)
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
    chat.tsx
    memories.tsx
    places.tsx
    stats.tsx
  /memory/[id].tsx
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

-- Chat
messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) not null,
  content text not null,
  read_at timestamptz,
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

-- Lugares (restaurantes etc)
places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude numeric,
  longitude numeric,
  visited_at date,
  cuisine text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
)

place_reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  user_id uuid references profiles(id),
  rating_food int check (rating_food between 1 and 5),
  rating_vibe int check (rating_vibe between 1 and 5),
  rating_price int check (rating_price between 1 and 5),
  notes text,
  would_return boolean,
  created_at timestamptz default now(),
  unique(place_id, user_id)
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

### 2. Chat realtime
- Lista de mensagens com paginação (mais novas primeiro).
- Subscription do Supabase Realtime no canal `messages`.
- Indicador "lido" via `read_at` (atualiza quando o destinatário abre a tela).
- Bubble do remetente à direita, do outro à esquerda.
- Push notification quando recebe mensagem com app fechado.
- **MVP só texto.** Imagens e áudio ficam pra V2.

### 3. Galeria / Memórias
- Cada memória tem **data própria** (`memory_date`), permitindo registrar momentos antigos.
- Uma memória pode ter múltiplas fotos (`memory_photos`).
- Upload via `expo-image-picker` → Supabase Storage (bucket `memories`).
- Comprimir imagens client-side antes do upload (qualidade 0.7, max 2000px).
- Visualizações:
  - **Timeline** (lista cronológica reversa)
  - **Calendário** (heatmap dos dias com memórias)
  - **Mapa** (pins onde memórias têm coordenadas)
- Cada memória tem: caption, local opcional, data, fotos.

### 4. Push Notifications
- Setup via `expo-notifications`. Salvar token em `profiles.expo_push_token`.
- Eventos que disparam notificação **pro outro**:
  - Nova mensagem no chat
  - Parceiro respondeu a pergunta do dia (sem revelar a resposta)
  - Nova memória adicionada
  - Novo lugar adicionado
  - Countdown se aproximando (N dias antes, conforme `notify_days_before`)
- Send via Edge Function chamando Expo Push API.
- **Nunca** notificar a si mesmo.

### 5. Countdowns
- Lista de eventos futuros ordenados pelo mais próximo.
- Cada item mostra: emoji, título, dias restantes.
- Tela inicial destaca o próximo.
- Cron job (Edge Function agendada) roda diariamente e envia push pros dias configurados.
- CRUD simples: criar, editar, deletar.

### 6. Perguntas Diárias + Streak (foguinho 🔥)
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

### 7. Lugares onde comemos (reviews)
- Adicionar lugar: nome, endereço (autocomplete via Places API opcional), data da visita, tipo de cozinha.
- Cada um faz seu review individualmente:
  - Nota comida (1–5)
  - Nota ambiente (1–5)
  - Nota custo-benefício (1–5)
  - Notas livres
  - "Voltaria?" (sim/não)
- Visão do lugar mostra os **dois reviews lado a lado** + médias.
- Listagem com filtros: melhores avaliados, mais recentes, "queremos voltar".
- Visão de mapa opcional.

### 8. Estatísticas do relacionamento
Dashboard com cards:
- Dias juntos
- Total de mensagens (e quem mandou mais)
- Mensagem mais longa
- Total de memórias
- Mês com mais memórias
- Streak atual e maior streak histórica
- Total de perguntas respondidas
- Total de lugares visitados
- Top 5 lugares
- Distância total entre lugares (se tiver coords) — "viajamos X km juntos"
- Distribuição de respostas por categoria de pergunta

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
3. ✅ Chat realtime
4. ✅ Memórias (galeria + upload)
5. ✅ Countdowns
6. ✅ Push notifications (infra base)
7. ✅ Perguntas diárias + streak
8. ✅ Lugares + reviews
9. ✅ Estatísticas

Cada feature deve ser entregue **inteira** antes de partir pra próxima (incluindo UI, banco, queries e push se aplicável).

---

## Notas Pessoais (preencher depois)

- Data de início do namoro: `17-01-2025`
- Aniversário dela: `03-02-2007`
- Meu aniversário: `12-02-2001`
- Lugares favoritos pra começar o catálogo:
- Apelidos que aparecem na UI:
