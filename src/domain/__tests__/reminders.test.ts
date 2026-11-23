import { DEFAULT_REMINDERS, shiftReminders } from '../reminders';
import type { Job, Shift } from '../shifts';

const job: Job = { id: 'j', name: 'Café', rate: 1271, frequency: 'weekly', anchor: '2026-11-27', lagDays: 0 };
const shift = (day: string, o: Partial<Shift> = {}): Shift => ({ id: day, jobId: 'j', day, start: '09:00', end: '17:30', breakMins: 30, multiplier: 1, extras: 0, status: 'planned', ...o });

test('leave, break and weekly rota reminders at the right local times', () => {
  const r = shiftReminders([shift('2026-11-24')], [job], DEFAULT_REMINDERS, '2026-11-23');
  const byId = Object.fromEntries(r.map((x) => [x.id.split('-')[1], x]));
  expect(byId.leave.at.getHours()).toBe(8);
  expect(byId.leave.at.getMinutes()).toBe(30);
  expect(byId.break.at.getHours()).toBe(13);
  expect(byId.rota.at.getDay()).toBe(0); // Sunday
  expect(byId.rota.at.getHours()).toBe(18);
});

test('no break reminder for short shifts; respects switches and the horizon', () => {
  const short = shiftReminders([shift('2026-11-24', { end: '13:00' })], [job], DEFAULT_REMINDERS, '2026-11-23');
  expect(short.some((x) => x.id.includes('break'))).toBe(false);
  const off = shiftReminders([shift('2026-11-24')], [job], { ...DEFAULT_REMINDERS, leave: false, breaks: false, weeklyRota: false }, '2026-11-23');
  expect(off).toEqual([]);
  expect(shiftReminders([shift('2027-01-30')], [job], { ...DEFAULT_REMINDERS, weeklyRota: false }, '2026-11-23')).toEqual([]);
  expect(shiftReminders([shift('2026-11-20')], [job], { ...DEFAULT_REMINDERS, weeklyRota: false }, '2026-11-23')).toEqual([]);
});

test('ids are stable per shift so rescheduling replaces rather than duplicates', () => {
  const a = shiftReminders([shift('2026-11-24')], [job], DEFAULT_REMINDERS, '2026-11-23').map((x) => x.id);
  const b = shiftReminders([shift('2026-11-24')], [job], DEFAULT_REMINDERS, '2026-11-23').map((x) => x.id);
  expect(a).toEqual(b);
  expect(new Set(a).size).toBe(a.length);
});
