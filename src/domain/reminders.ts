// Shift reminders: leave for your shift (catch the bus), take your break, check next week's rota.
// Pure: turns shifts and preferences into reminder times. Scheduling happens in the app layer.
import { addDays, diffDays, startOfWeek, type DayKey } from '@/kit/dates';
import type { Scheduled } from '@/kit/reminders';
import { minutes, paidMinutes, type Job, type Shift } from './shifts';

export type ReminderPrefs = { leave: boolean; travelMins: number; breaks: boolean; breakAfterMins: number; weeklyRota: boolean };
export const DEFAULT_REMINDERS: ReminderPrefs = { leave: true, travelMins: 30, breaks: true, breakAfterMins: 240, weeklyRota: true };

export const PREFIX = 'shift-';

function at(day: DayKey, mins: number): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, Math.floor(mins / 60), mins % 60, 0, 0);
}

/** Reminders for shifts in the next `horizon` days. Breaks only for shifts over 6 hours (the legal 20-minute break). */
export function shiftReminders(shifts: Shift[], jobs: Job[], prefs: ReminderPrefs, today: DayKey, horizon = 14): Scheduled[] {
  const out: Scheduled[] = [];
  for (const s of shifts) {
    const ahead = diffDays(today, s.day);
    if (ahead < 0 || ahead > horizon) continue;
    const job = jobs.find((j) => j.id === s.jobId);
    const start = minutes(s.start);
    if (!job || start == null) continue;
    if (prefs.leave) {
      const leaveAt = at(s.day, start - prefs.travelMins);
      out.push({ id: `${PREFIX}leave-${s.id}`, at: leaveAt, title: `Time to head to ${job.name}`, body: `Your shift starts at ${s.start}. Leave now to catch your bus or train.` });
    }
    const span = paidMinutes({ ...s, breakMins: 0 }) ?? 0;
    if (prefs.breaks && span > 6 * 60 && prefs.breakAfterMins < span) {
      out.push({ id: `${PREFIX}break-${s.id}`, at: at(s.day, start + prefs.breakAfterMins), title: 'Break time', body: 'Shifts over 6 hours come with at least a 20-minute rest break by law. Take it if you can.' });
    }
  }
  if (prefs.weeklyRota) {
    const sunday = addDays(startOfWeek(today), 6);
    out.push({ id: `${PREFIX}rota-${sunday}`, at: at(sunday, 18 * 60), title: "Next week's rota", body: 'Check your shifts for next week and add them, so your pay estimate stays right.' });
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
