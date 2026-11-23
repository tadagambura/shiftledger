import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { track } from '@/kit/analytics';
import { addDays, diffDays, todayKey, type DayKey } from '@/kit/dates';
import { useFeedback } from '@/kit/feedback';
import { DateStepper, MoneyField } from '@/kit/inputs';
import { formatGBP, type Pence } from '@/kit/money';
import { Button, Chip, Field, Muted, Note, Row, Screen, Section, Stack } from '@/kit/ui';
import { paidMinutes, shiftError, shiftPay, type Shift } from '@/domain/shifts';
import { useLedger } from '@/state/ledger';

const MULTS = [1, 1.25, 1.5, 2];

export default function ShiftScreen() {
  const { id, day: dayParam } = useLocalSearchParams<{ id?: string; day?: string }>();
  const { jobs, shifts } = useLedger();
  const { toast } = useFeedback();
  const existing = shifts.find((s) => s.id === id);
  const last = [...shifts].reverse().find((s) => s.status === 'worked');
  const today = todayKey();
  const [jobId, setJobId] = useState(existing?.jobId ?? jobs[0]?.id ?? '');
  const [day, setDay] = useState<DayKey>(existing?.day ?? dayParam ?? today);
  const [start, setStart] = useState(existing?.start ?? last?.start ?? '09:00');
  const [end, setEnd] = useState(existing?.end ?? last?.end ?? '17:00');
  const [brk, setBrk] = useState(String(existing?.breakMins ?? last?.breakMins ?? 30));
  const [mult, setMult] = useState(existing?.multiplier ?? 1);
  const [extras, setExtras] = useState<Pence | null>(existing?.extras ?? 0);
  const [err, setErr] = useState<string | null>(null);
  const job = jobs.find((j) => j.id === jobId);
  const future = diffDays(today, day) > 0;
  const draft: Omit<Shift, 'id'> = { jobId, day, start, end, breakMins: Number(brk) || 0, multiplier: mult, extras: extras ?? 0, status: future ? 'planned' : (existing?.status ?? 'worked') };
  const mins = paidMinutes(draft);

  const save = () => {
    if (!job) return setErr('Add a job first.');
    const e = shiftError({ start, end, breakMins: Number(brk) });
    if (e || brk.trim() === '' || Number.isNaN(Number(brk))) return setErr(e ?? 'Break minutes should be a number.');
    useLedger.getState().saveShift({ ...draft, id: existing?.id });
    track('core_action_completed', { what: future ? 'shift_planned' : 'shift_logged', overtime: mult > 1 });
    toast(future ? 'Shift added to your rota.' : `Shift logged: ${formatGBP(shiftPay({ ...draft, id: 'x' }, job))} before tax.`);
    router.back();
  };

  return (
    <Screen edges={['bottom']} testID="shift" footer={<Button title={future ? 'Add to rota' : 'Save shift'} onPress={save} testID="shift-save" />}>
      {jobs.length > 1 ? (
        <Row wrap gap={8}>
          {jobs.map((j) => (
            <Chip key={j.id} label={j.name} selected={jobId === j.id} onPress={() => setJobId(j.id)} />
          ))}
        </Row>
      ) : null}
      <DateStepper label="Day" value={day} onChange={setDay} min={addDays(today, -62)} max={addDays(today, 62)} testID="shift-day" />
      <Row gap={10}>
        <Stack style={{ flex: 1 }}>
          <Field label="Start" value={start} onChangeText={setStart} placeholder="09:00" maxLength={5} testID="shift-start" />
        </Stack>
        <Stack style={{ flex: 1 }}>
          <Field label="End" value={end} onChangeText={setEnd} placeholder="17:00" maxLength={5} testID="shift-end" />
        </Stack>
      </Row>
      <Field label="Unpaid break (minutes)" value={brk} onChangeText={setBrk} inputMode="numeric" keyboardType="number-pad" maxLength={3} testID="shift-break" />
      <Section title="Rate">
        <Row wrap gap={8}>
          {MULTS.map((m) => (
            <Chip key={m} label={m === 1 ? 'Normal' : `×${m}`} selected={mult === m} onPress={() => setMult(m)} testID={`shift-mult-${m}`} />
          ))}
        </Row>
      </Section>
      <MoneyField label="Extras through payroll (optional)" value={extras} onChange={setExtras} hint="Bonus, holiday pay or tronc that appears on your payslip." testID="shift-extras" />
      {job && mins ? <Note>{`${Math.floor(mins / 60)}h ${mins % 60}m paid · about ${formatGBP(shiftPay({ ...draft, id: 'x' }, job))} before tax${future ? ' (planned)' : ''}`}</Note> : null}
      {err ? <Note tone="warning">{err}</Note> : null}
      <Muted>Shifts that finish after midnight are fine: an end time earlier than the start counts as the next morning.</Muted>
    </Screen>
  );
}
