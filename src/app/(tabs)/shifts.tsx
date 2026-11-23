import { router } from 'expo-router';
import { diffDays, formatDay, todayKey } from '@/kit/dates';
import { useFeedback } from '@/kit/feedback';
import { formatGBP } from '@/kit/money';
import { Button, Card, EmptyState, H1, IconButton, Muted, Row, Screen, Section, Stack, Strong } from '@/kit/ui';
import { paidMinutes, shiftPay, type Shift } from '@/domain/shifts';
import { useLedger } from '@/state/ledger';

function ShiftRow({ s }: { s: Shift }) {
  const l = useLedger();
  const { toast } = useFeedback();
  const job = l.jobs.find((j) => j.id === s.jobId);
  if (!job) return null;
  const mins = paidMinutes(s) ?? 0;
  return (
    <Card onPress={() => router.push(`/shift?id=${s.id}`)} testID={`shift-${s.day}`} accessibilityLabel={`${job.name}, ${formatDay(s.day, 'long')}, ${s.start} to ${s.end}, ${s.status}`}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Stack gap={2} style={{ flex: 1 }}>
          <Strong>{`${formatDay(s.day)} · ${s.start}–${s.end}`}</Strong>
          <Muted>{`${job.name} · ${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}${s.multiplier > 1 ? ` · ×${s.multiplier}` : ''} · ${formatGBP(shiftPay(s, job))}${s.status === 'planned' ? ' · planned' : ''}`}</Muted>
        </Stack>
        <IconButton
          icon="trash-outline"
          label="Delete shift"
          onPress={() => {
            const removed = l.removeShift(s.id);
            toast('Shift deleted.', { actionLabel: 'Undo', onAction: () => removed && useLedger.getState().restoreShift(removed) });
          }}
        />
      </Row>
    </Card>
  );
}

export default function Shifts() {
  const shifts = useLedger((s) => s.shifts);
  const today = todayKey();
  const upcoming = shifts.filter((s) => diffDays(today, s.day) >= 0 && s.status === 'planned').sort((a, b) => (a.day < b.day ? -1 : 1));
  const past = shifts.filter((s) => s.status === 'worked').sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 30);
  const missed = shifts.filter((s) => s.status === 'planned' && diffDays(s.day, today) > 0);
  return (
    <Screen testID="shifts">
      <H1>Shifts</H1>
      <Button title="Add a shift or plan your rota" icon="add" onPress={() => router.push('/shift')} testID="shifts-add" />
      {missed.length ? (
        <Section title="Not confirmed yet">
          <Muted>Planned shifts from earlier days. Did you work them? Tap to confirm or edit.</Muted>
          {missed.map((s) => (
            <Row key={s.id} gap={8}>
              <Stack style={{ flex: 1 }}><ShiftRow s={s} /></Stack>
              <Button small title="Worked" onPress={() => useLedger.getState().confirmShift(s.id)} />
            </Row>
          ))}
        </Section>
      ) : null}
      <Section title="Rota">
        {upcoming.length ? upcoming.map((s) => <ShiftRow key={s.id} s={s} />) : <Muted>Nothing planned. Add upcoming shifts to see your next payslip ahead of time.</Muted>}
      </Section>
      <Section title="Worked">
        {past.length ? past.map((s) => <ShiftRow key={s.id} s={s} />) : <EmptyState icon="time-outline" title="No shifts logged yet" />}
      </Section>
    </Screen>
  );
}
