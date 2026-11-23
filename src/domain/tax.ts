// UK take-home pay ESTIMATE for one pay period, tax year 2026/27.
// Sources and rounding rules: app-portfolio docs/pilots/research/uk-rules-2026-27.md (checked 23 Nov 2026).
// This is deliberately an estimate: it treats each payslip on its own (like a Week 1 / Month 1
// tax code), so it can differ from real cumulative PAYE. The app always labels it that way.
import type { Pence } from '@/kit/money';

export const TAX_YEAR = '2026/27';
export const RULES_CHECKED = '2026-11-23';

export type Frequency = 'weekly' | 'fortnightly' | 'fourweekly' | 'monthly';
export const PERIODS: Record<Frequency, number> = { weekly: 52, fortnightly: 26, fourweekly: 13, monthly: 12 };

export type Region = 'ruk' | 'scotland';
export type LoanPlan = 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5';

export type TaxSetup = {
  region: Region;
  /** The number in an L tax code, e.g. 1257 for 1257L. */
  codeNumber: number;
  loan: LoanPlan;
  postgrad: boolean;
  /** Employee pension contribution as a % of qualifying earnings (0 if not enrolled). */
  pensionPct: number;
};

export const DEFAULT_SETUP: TaxSetup = { region: 'ruk', codeNumber: 1257, loan: 'none', postgrad: false, pensionPct: 0 };

type Band = { rate: number; width: number | null }; // width in pounds a year above the allowance
const BANDS: Record<Region, Band[]> = {
  ruk: [
    { rate: 0.2, width: 37_700 },
    { rate: 0.4, width: 87_440 },
    { rate: 0.45, width: null },
  ],
  scotland: [
    { rate: 0.19, width: 3_967 },
    { rate: 0.2, width: 12_989 },
    { rate: 0.21, width: 14_136 },
    { rate: 0.42, width: 31_338 },
    { rate: 0.45, width: 62_710 },
    { rate: 0.48, width: null },
  ],
};

// Employee Class 1 NI thresholds per period, in pounds (2026/27).
const NI: Record<Frequency, { pt: number; uel: number }> = {
  weekly: { pt: 242, uel: 967 },
  fortnightly: { pt: 484, uel: 1934 },
  fourweekly: { pt: 968, uel: 3868 },
  monthly: { pt: 1048, uel: 4189 },
};
const NI_MAIN = 0.08;
const NI_UPPER = 0.02;

const LOANS: Record<Exclude<LoanPlan, 'none'>, number> = { plan1: 26_900, plan2: 29_385, plan4: 33_795, plan5: 25_000 };
const POSTGRAD = 21_000;

// Auto-enrolment qualifying earnings band (annual pounds).
const QE_LOWER = 6_240;
const QE_UPPER = 50_270;

export type Estimate = { gross: Pence; tax: Pence; ni: Pence; loan: Pence; pension: Pence; net: Pence };

const floorPounds = (p: Pence) => Math.floor(p / 100) * 100;

export function estimate(gross: Pence, freq: Frequency, s: TaxSetup): Estimate {
  if (gross <= 0) return { gross: 0, tax: 0, ni: 0, loan: 0, pension: 0, net: 0 };
  const n = PERIODS[freq];

  // Pension (relief at source/net pay ignored: treated as a deduction after tax, the common case)
  const qeLower = Math.round((QE_LOWER * 100) / n);
  const qeUpper = Math.round((QE_UPPER * 100) / n);
  const pension = s.pensionPct > 0 ? Math.round((Math.max(0, Math.min(gross, qeUpper) - qeLower) * s.pensionPct) / 100) : 0;

  // Income tax: free pay from the code, then bands scaled to the period.
  const freePay = Math.ceil(((s.codeNumber * 10 + 9) * 100) / n);
  let taxable = floorPounds(Math.max(0, gross - freePay));
  let tax = 0;
  for (const b of BANDS[s.region]) {
    if (taxable <= 0) break;
    const width = b.width == null ? Infinity : Math.ceil((b.width * 100) / n);
    const slice = Math.min(taxable, width);
    tax += slice * b.rate;
    taxable -= slice;
  }
  tax = Math.floor(tax);
  tax = Math.min(tax, Math.floor(gross / 2)); // PAYE never takes more than half of the period's pay

  // National Insurance (non-cumulative per period).
  const { pt, uel } = NI[freq];
  const main = Math.max(0, Math.min(gross, uel * 100) - pt * 100);
  const upper = Math.max(0, gross - uel * 100);
  const ni = Math.round(main * NI_MAIN + upper * NI_UPPER);

  // Student and postgraduate loans: % of earnings over the period threshold, rounded down to £1.
  let loan = 0;
  if (s.loan !== 'none') loan += floorPounds(Math.max(0, gross - Math.round((LOANS[s.loan] * 100) / n)) * 0.09);
  if (s.postgrad) loan += floorPounds(Math.max(0, gross - Math.round((POSTGRAD * 100) / n)) * 0.06);

  return { gross, tax, ni, loan, pension, net: gross - tax - ni - loan - pension };
}

export function parseTaxCode(code: string): { region: Region; codeNumber: number } | null {
  const m = code.trim().toUpperCase().replace(/\s+/g, '').match(/^(S|C)?(\d{1,5})L(W1|M1|X)?$/);
  if (!m) return null;
  return { region: m[1] === 'S' ? 'scotland' : 'ruk', codeNumber: Number(m[2]) };
}
