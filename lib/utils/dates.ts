import { differenceInCalendarDays, differenceInYears, isValid, parse, parseISO } from 'date-fns';
import { env } from '@/lib/env';

export function daysTogether(now: Date = new Date()): number {
  return differenceInCalendarDays(now, parseISO(env.COUPLE_STARTED_AT));
}

const MILESTONES = [100, 200, 300, 365, 500, 730, 1000, 1095, 1500, 1825, 2000, 2555, 3650];

export function nextMilestone(currentDays: number): number {
  return MILESTONES.find((m) => m > currentDays) ?? Math.ceil((currentDays + 1) / 1000) * 1000;
}

export function calculateAge(isoBirthday: string | null, now: Date = new Date()): number | null {
  if (!isoBirthday) return null;
  const d = parseISO(isoBirthday);
  if (!isValid(d)) return null;
  return differenceInYears(now, d);
}

const BR_FORMAT = 'dd/MM/yyyy';

export function parseBRDate(input: string): string | null {
  const d = parse(input, BR_FORMAT, new Date());
  if (!isValid(d)) return null;
  return d.toISOString().slice(0, 10);
}

export function formatBRDate(iso: string | null): string {
  if (!iso) return '';
  const d = parseISO(iso);
  if (!isValid(d)) return '';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function maskBRDate(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function daysFromNow(isoDate: string, now: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(isoDate), now);
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) return 'Já passou';
  if (days === 0) return 'Hoje!';
  if (days === 1) return 'Amanhã';
  return `Em ${days} dias`;
}
