import { differenceInCalendarDays, parseISO } from 'date-fns';
import { env } from '@/lib/env';

export function daysTogether(now: Date = new Date()): number {
  return differenceInCalendarDays(now, parseISO(env.COUPLE_STARTED_AT));
}

const MILESTONES = [100, 200, 300, 365, 500, 730, 1000, 1095, 1500, 1825, 2000];

export function nextMilestone(currentDays: number): number {
  return MILESTONES.find((m) => m > currentDays) ?? Math.ceil((currentDays + 1) / 1000) * 1000;
}
