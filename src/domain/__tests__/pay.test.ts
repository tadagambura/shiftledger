import { DEFAULT_SETUP, estimate, parseTaxCode } from '../tax';
import { checkPayslip, earnedUnpaid, nextPayday, paidMinutes, payPeriod, periodFor, shiftError, shiftPay, type Job, type Shift } from '../shifts';

const job: Job = { id: 'j', name: 'Café', rate: 1271, frequency: 'weekly', anchor: '2026-11-27', lagDays: 7 };
const shift = (day: string, o: Partial<Shift> = {}): Shift => ({ id: day + (o.start ?? ''), jobId: 'j', day, start: '09:00', end: '17:30', breakMins: 30, multiplier: 1, extras: 0, status: 'worked', ...o });

describe('tax and NI estimate (2026/27, one period on its own)', () => {
  test('monthly £2,000 on 1257L in England', () => {
    const e = estimate(200_000, 'monthly', DEFAULT_SETUP);
    // free pay 12579/12 = £1,048.25 → taxable £951 → £190.20; NI (2000 − 1048) × 8% = £76.16
    expect(e.tax).toBe(19_020);
    expect(e.ni).toBe(7_616);
    expect(e.net).toBe(200_000 - 19_020 - 7_616);
  });
  test('weekly pay under the thresholds has no tax or NI', () => {
    const e = estimate(24_000, 'weekly', DEFAULT_SETUP);
    expect(e).toMatchObject({ tax: 0, ni: 0, net: 24_000 });
  });
  test('Scotland uses its own bands (starter 19%)', () => {
    const e = estimate(150_000, 'monthly', { ...DEFAULT_SETUP, region: 'scotland' });
    // taxable £451: starter band per month = 3967/12 = £330.59 → £330.59×19% + £120.41×20%
    expect(e.tax).toBe(Math.floor(33059 * 0.19 + (45100 - 33059) * 0.2));
  });
  test('higher earners hit 40% and the 2% NI rate', () => {
    const e = estimate(500_000, 'monthly', DEFAULT_SETUP);
    expect(e.ni).toBe(Math.round((418_900 - 104_800) * 0.08 + (500_000 - 418_900) * 0.02));
    expect(e.tax).toBeGreaterThan(19_020 * 4);
  });
  test('student loan Plan 2 and pension', () => {
    const e = estimate(300_000, 'monthly', { ...DEFAULT_SETUP, loan: 'plan2', pensionPct: 5 });
    expect(e.loan).toBe(Math.floor(((300_000 - 244_875) * 0.09) / 100) * 100); // £49
    expect(e.pension).toBe(Math.round((300_000 - 52_000) * 0.05));
  });
  test('tax codes', () => {
    expect(parseTaxCode('1257L')).toEqual({ region: 'ruk', codeNumber: 1257 });
    expect(parseTaxCode('s1257l')).toEqual({ region: 'scotland', codeNumber: 1257 });
    expect(parseTaxCode('1257L M1')).toEqual({ region: 'ruk', codeNumber: 1257 });
    expect(parseTaxCode('BR')).toBeNull();
  });
});

describe('shifts', () => {
  test('paid time handles breaks and overnight shifts', () => {
    expect(paidMinutes({ start: '09:00', end: '17:30', breakMins: 30 })).toBe(480);
    expect(paidMinutes({ start: '22:00', end: '06:00', breakMins: 0 })).toBe(480);
    expect(shiftError({ start: '9', end: '17:00', breakMins: 0 })).toMatch(/09:00/);
    expect(shiftError({ start: '09:00', end: '09:30', breakMins: 45 })).toMatch(/longer/);
  });
  test('pay = rate × multiplier × hours + extras', () => {
    expect(shiftPay(shift('2026-11-20'), job)).toBe(1271 * 8);
    expect(shiftPay(shift('2026-11-20', { multiplier: 1.5, extras: 500 }), job)).toBe(Math.round(1271 * 1.5 * 8) + 500);
  });
  test('paydays and periods paid a week in arrears', () => {
    expect(nextPayday(job, '2026-11-23')).toBe('2026-11-27');
    expect(periodFor(job, '2026-11-27')).toEqual({ from: '2026-11-14', to: '2026-11-20' });
    const p = payPeriod(job, [shift('2026-11-14'), shift('2026-11-20'), shift('2026-11-21'), shift('2026-11-19', { status: 'planned' })], '2026-11-27', DEFAULT_SETUP);
    expect(p.worked).toHaveLength(2);
    expect(p.planned).toHaveLength(1);
    expect(p.gross).toBe(1271 * 16);
  });
  test('earned but not yet paid', () => {
    // Last payday was Fri 20 Nov, which paid up to 13 Nov. Shifts from 14 Nov to today are unpaid.
    const shifts = [shift('2026-11-13'), shift('2026-11-14'), shift('2026-11-22'), shift('2026-11-24', { status: 'planned' })];
    expect(earnedUnpaid(job, shifts, '2026-11-23')).toBe(1271 * 16);
  });
  test('payslip check is calm and only flags real gaps', () => {
    const p = payPeriod(job, [shift('2026-11-16'), shift('2026-11-17')], '2026-11-27', DEFAULT_SETUP);
    expect(checkPayslip({ jobId: 'j', payday: '2026-11-27', gross: p.gross, net: p.est.net }, p).state).toBe('ok');
    const short = checkPayslip({ jobId: 'j', payday: '2026-11-27', gross: p.gross - 1271 * 8, net: p.est.net - 10_000 }, p);
    expect(short.state).toBe('check');
    expect(short.message).toMatch(/Worth checking/);
  });
});
