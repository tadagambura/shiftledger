// Shifts, pay periods, earned-but-unpaid and the payslip check.
import { addDays, addMonths, diffDays, type DayKey } from '@/kit/dates';
import type { Pence } from '@/kit/money';
import { estimate, type Estimate, type Frequency, type TaxSetup } from './tax';

export type Job = {
  id: string;
  name: string;
  rate: Pence; // per hour
  frequency: Frequency;
  anchor: DayKey; // any real payday
  /** Days between the end of the work period and payday (paid in arrears). */
  lagDays: number;
};

export type Shift = {
  id: string;
  jobId: string;
  day: DayKey;
  start: string; // "HH:MM"
  end: string; // "HH:MM", may be after midnight
  breakMins: number; // unpaid
  multiplier: number; // 1 = normal, 1.5 = time and a half
  extras: Pence; // paid through payroll (bonus, holiday pay)
  status: 'planned' | 'worked';
};

export type Payslip = { jobId: string; payday: DayKey; gross: Pence | null; net: Pence };

export function minutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 23 || mm > 59) return null;
  return h * 60 + mm;
}

/** Paid minutes: overnight shifts wrap past midnight; breaks are unpaid. */
export function paidMinutes(s: Pick<Shift, 'start' | 'end' | 'breakMins'>): number | null {
  const a = minutes(s.start);
  const b = minutes(s.end);
  if (a == null || b == null) return null;
  const span = b > a ? b - a : b + 24 * 60 - a;
  const paid = span - s.breakMins;
  return paid > 0 ? paid : null;
}

export function shiftPay(s: Shift, job: Job): Pence {
  const m = paidMinutes(s) ?? 0;
  return Math.round((job.rate * s.multiplier * m) / 60) + s.extras;
}

export function shiftError(s: Pick<Shift, 'start' | 'end' | 'breakMins'>): string | null {
  if (minutes(s.start) == null || minutes(s.end) == null) return 'Times look like 09:00 or 22:30.';
  if (!Number.isInteger(s.breakMins) || s.breakMins < 0) return 'Break minutes should be 0 or more.';
  if (paidMinutes(s) == null) return 'The break is longer than the shift.';
  if ((paidMinutes(s) ?? 0) > 18 * 60) return "That's over 18 hours. Check the times?";
  return null;
}

// ---------- Paydays and periods ----------

export function nextPayday(job: Pick<Job, 'frequency' | 'anchor'>, today: DayKey): DayKey {
  if (job.frequency === 'monthly') {
    const dom = Number(job.anchor.slice(8, 10));
    const [ay, am] = job.anchor.split('-').map(Number);
    const [ty, tm] = today.split('-').map(Number);
    let i = (ty - ay) * 12 + (tm - am) - 1;
    let k = addMonths(job.anchor, i, dom);
    while (diffDays(k, today) > 0) k = addMonths(job.anchor, ++i, dom);
    return k;
  }
  const step = job.frequency === 'weekly' ? 7 : job.frequency === 'fortnightly' ? 14 : 28;
  return addDays(job.anchor, Math.ceil(diffDays(job.anchor, today) / step) * step);
}

export function previousPayday(job: Pick<Job, 'frequency' | 'anchor'>, payday: DayKey): DayKey {
  if (job.frequency === 'monthly') return addMonths(payday, -1, Number(job.anchor.slice(8, 10)));
  return addDays(payday, job.frequency === 'weekly' ? -7 : job.frequency === 'fortnightly' ? -14 : -28);
}

/** The work days a payday pays for: (previous payday − lag, payday − lag]. */
export function periodFor(job: Job, payday: DayKey): { from: DayKey; to: DayKey } {
  const prev = previousPayday(job, payday);
  return { from: addDays(prev, 1 - job.lagDays), to: addDays(payday, -job.lagDays) };
}

export function inPeriod(day: DayKey, p: { from: DayKey; to: DayKey }) {
  return diffDays(p.from, day) >= 0 && diffDays(day, p.to) >= 0;
}

export type PayPeriod = { payday: DayKey; from: DayKey; to: DayKey; worked: Shift[]; planned: Shift[]; gross: Pence; plannedGross: Pence; est: Estimate };

export function payPeriod(job: Job, shifts: Shift[], payday: DayKey, setup: TaxSetup): PayPeriod {
  const p = periodFor(job, payday);
  const mine = shifts.filter((s) => s.jobId === job.id && inPeriod(s.day, p));
  const worked = mine.filter((s) => s.status === 'worked');
  const planned = mine.filter((s) => s.status === 'planned');
  const gross = worked.reduce((t, s) => t + shiftPay(s, job), 0);
  const plannedGross = planned.reduce((t, s) => t + shiftPay(s, job), 0);
  return { payday, ...p, worked, planned, gross, plannedGross, est: estimate(gross + plannedGross, job.frequency, setup) };
}

/** Worked shifts not yet paid: anything worked after the cut-off of the most recent payday that has passed. */
export function earnedUnpaid(job: Job, shifts: Shift[], today: DayKey): Pence {
  const next = nextPayday(job, today);
  const lastPaid = next === today ? today : previousPayday(job, next);
  const cutoff = addDays(lastPaid, -job.lagDays);
  return shifts
    .filter((s) => s.jobId === job.id && s.status === 'worked' && diffDays(cutoff, s.day) > 0 && diffDays(s.day, today) >= 0)
    .reduce((t, s) => t + shiftPay(s, job), 0);
}

export type Check = { state: 'ok' | 'check'; diff: Pence; message: string };

/** Payslip check: calm, never accusatory. Flags gaps over £5 and over 2% of the estimate. */
export function checkPayslip(slip: Payslip, period: PayPeriod): Check {
  const expectedGross = period.gross;
  if (slip.gross != null) {
    const d = slip.gross - expectedGross;
    if (Math.abs(d) > 500 && Math.abs(d) > expectedGross * 0.02)
      return { state: 'check', diff: d, message: d < 0 ? 'Gross pay looks lower than your logged shifts. Worth checking the hours and rate on the payslip.' : 'Gross pay is higher than your logged shifts. Maybe a shift or bonus is missing here?' };
  }
  const d = slip.net - period.est.net;
  if (Math.abs(d) > 500 && Math.abs(d) > period.est.net * 0.02)
    return { state: 'check', diff: d, message: d < 0 ? 'Take-home is lower than our estimate. Tax codes, pensions or deductions can explain it, but it may be worth a look.' : "Take-home is higher than our estimate. Nice, but worth checking it isn't a one-off." };
  return { state: 'ok', diff: d, message: 'Looks about right against your logged shifts.' };
}
