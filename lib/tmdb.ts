import { env } from './env';

export type TmdbHit = {
  id: number;
  title: string;
  poster_url: string | null;
  year: string | null;
};

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

type RawResult = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
};

export async function searchTmdb(query: string, kind: 'movie' | 'tv'): Promise<TmdbHit[]> {
  if (!env.TMDB_TOKEN || query.trim().length < 2) return [];
  const url = `https://api.themoviedb.org/3/search/${kind}?query=${encodeURIComponent(
    query.trim(),
  )}&language=pt-BR&page=1&include_adult=false`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.TMDB_TOKEN}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  const data = (await res.json()) as { results?: RawResult[] };
  return (data.results ?? []).slice(0, 12).map((r) => ({
    id: r.id,
    title: kind === 'movie' ? r.title ?? '' : r.name ?? '',
    poster_url: r.poster_path ? `${POSTER_BASE}${r.poster_path}` : null,
    year: (kind === 'movie' ? r.release_date : r.first_air_date)?.slice(0, 4) ?? null,
  }));
}

export function isTmdbConfigured(): boolean {
  return !!env.TMDB_TOKEN;
}
