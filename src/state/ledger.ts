import type { DayKey } from '@/kit/dates';
import { persisted, uid } from '@/kit/store';
import type { Job, Payslip, Shift } from '@/domain/shifts';
import { DEFAULT_SETUP, type TaxSetup } from '@/domain/tax';

type LedgerState = {
  jobs: Job[];
  shifts: Shift[];
  payslips: Payslip[];
  daysOff: DayKey[];
  setup: TaxSetup;
  saveJob: (j: Omit<Job, 'id'> & { id?: string }) => string;
  removeJob: (id: string) => void;
  saveShift: (s: Omit<Shift, 'id'> & { id?: string }) => string;
  confirmShift: (id: string) => void;
  removeShift: (id: string) => Shift | undefined;
  restoreShift: (s: Shift) => void;
  toggleDayOff: (day: DayKey) => void;
  savePayslip: (p: Payslip) => void;
  setSetup: (patch: Partial<TaxSetup>) => void;
};

export const useLedger = persisted<LedgerState>('shiftledger.ledger', 1, (set, get) => ({
  jobs: [],
  shifts: [],
  payslips: [],
  daysOff: [],
  setup: DEFAULT_SETUP,
  saveJob: (j) => {
    const id = j.id ?? uid('j');
    set((s) => ({ jobs: s.jobs.some((x) => x.id === id) ? s.jobs.map((x) => (x.id === id ? { ...j, id } : x)) : [...s.jobs, { ...j, id }] }));
    return id;
  },
  removeJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id), shifts: s.shifts.filter((x) => x.jobId !== id), payslips: s.payslips.filter((p) => p.jobId !== id) })),
  saveShift: (sh) => {
    const id = sh.id ?? uid('s');
    set((s) => ({ shifts: s.shifts.some((x) => x.id === id) ? s.shifts.map((x) => (x.id === id ? { ...sh, id } : x)) : [...s.shifts, { ...sh, id }] }));
    return id;
  },
  confirmShift: (id) => set((s) => ({ shifts: s.shifts.map((x) => (x.id === id ? { ...x, status: 'worked' } : x)) })),
  removeShift: (id) => {
    const sh = get().shifts.find((x) => x.id === id);
    set((s) => ({ shifts: s.shifts.filter((x) => x.id !== id) }));
    return sh;
  },
  restoreShift: (sh) => set((s) => ({ shifts: [...s.shifts, sh] })),
  toggleDayOff: (day) => set((s) => ({ daysOff: s.daysOff.includes(day) ? s.daysOff.filter((d) => d !== day) : [...s.daysOff, day] })),
  savePayslip: (p) => set((s) => ({ payslips: [...s.payslips.filter((x) => !(x.jobId === p.jobId && x.payday === p.payday)), p] })),
  setSetup: (patch) => set((s) => ({ setup: { ...s.setup, ...patch } })),
}));
