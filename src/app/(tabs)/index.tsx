import { router } from 'expo-router';
import { addDays, formatDay, relativeDay, todayKey } from '@/kit/dates';
import { useFeedback } from '@/kit/feedback';
import { formatGBP } from '@/kit/money';
import { computeStreak } from '@/kit/streak';
import { Body, Button, Card, Divider, EmptyState, H1, H2, Label, Muted, Row, Screen, Stack, Strong } from '@/kit/ui';
import { earnedUnpaid, nextPayday, payPeriod, shiftPay } from '@/domain/shifts';
import { useLedger } from '@/state/ledger';
import '@/arcade';
import { ArcadeEntry } from '@/kit/arcade/screens';

export default function Today() {
  const l = useLedger();
  const { toast } = useFeedback();
  const today = todayKey();
  if (!l.jobs.length) {
    return (
      <Screen testID="today">
        <H1>ShiftLedger</H1>
        <EmptyState icon="briefcase-outline" title="Add your job to start" body="Your hourly rate and payday are all ShiftLedger needs. Nothing leaves your phone." action={<Button title="Add my job" onPress={() => router.push('/job')} testID="add-job" />} />
      </Screen>
    );
  }

  const todays = l.shifts.filter((s) => s.day === today);
  const dayOff = l.daysOff.includes(today);
  const shiftDays = new Set(l.shifts.map((s) => s.day));
  const firstDay = l.shifts.reduce((a, s) => (s.day < a ? s.day : a), today);
  const streak = computeStreak({ done: l.shifts.filter((s) => s.status === 'worked').map((s) => s.day), rest: l.daysOff, start: firstDay, today, isScheduled: (k) => shiftDays.has(k) });

  return (
    <Screen testID="today">
      <Stack gap={2}>
        <Muted>{formatDay(today, 'long')}</Muted>
        <H1>Today</H1>
      </Stack>

      <Card testID="today-shift">
        <Label>Today</Label>
        {dayOff ? (
          <Body>Day off. No reminders, and your shift streak is safe. Enjoy the hammock.</Body>
        ) : todays.length ? (
          todays.map((s) => {
            const job = l.jobs.find((j) => j.id === s.jobId)!;
            return (
              <Stack key={s.id} gap={6}>
                <Strong>{`${job.name} · ${s.start}–${s.end}`}</Strong>
                {s.status === 'planned' ? (
                  <Button
                    title={`Confirm shift (${formatGBP(shiftPay(s, job))})`}
                    icon="checkmark"
                    testID="confirm-shift"
                    onPress={() => {
                      l.confirmShift(s.id);
                      toast(`Logged. ${formatGBP(shiftPay(s, job))} earned before tax.`);
                    }}
                  />
                ) : (
                  <Muted>{`Logged · ${formatGBP(shiftPay(s, job))} before tax`}</Muted>
                )}
              </Stack>
            );
          })
        ) : (
          <Muted>No shift planned today.</Muted>
        )}
        <Row wrap gap={8}>
          {!dayOff ? <Button small variant="secondary" title="Log a shift" icon="add" onPress={() => router.push('/shift')} testID="log-shift" /> : null}
          {!todays.some((s) => s.status === 'worked') ? <Button small variant="ghost" title={dayOff ? 'Not a day off' : 'Day off'} icon="bed-outline" onPress={() => l.toggleDayOff(today)} testID="day-off" /> : null}
        </Row>
        {streak.current > 1 ? <Muted>{`${streak.current} rota shifts logged in a row.`}</Muted> : null}
      </Card>

      {l.jobs.map((job) => {
        const payday = nextPayday(job, addDays(today, 1));
        const p = payPeriod(job, l.shifts, payday, l.setup);
        const unpaid = earnedUnpaid(job, l.shifts, today);
        return (
          <Card key={job.id} testID={`job-${job.name}`}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Strong>{job.name}</Strong>
              <Muted>{`Payday ${formatDay(payday)} (${relativeDay(payday, today)})`}</Muted>
            </Row>
            <Label>Earned, not paid yet</Label>
            <H2 testID="unpaid">{formatGBP(unpaid)}</H2>
            <Divider />
            <Label>Next payslip (estimate)</Label>
            <Row style={{ justifyContent: 'space-between' }}>
              <Body>{`Gross${p.planned.length ? ' incl. planned shifts' : ''}`}</Body>
              <Body testID="next-gross">{formatGBP(p.est.gross)}</Body>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Body>Tax, NI and deductions</Body>
              <Body>{`−${formatGBP(p.est.gross - p.est.net)}`}</Body>
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Strong>Take-home</Strong>
              <Strong testID="next-net">{formatGBP(p.est.net)}</Strong>
            </Row>
            <Muted>{`Covers shifts ${formatDay(p.from)} to ${formatDay(p.to)}. An estimate based on what you've logged.`}</Muted>
          </Card>
        );
      })}
      <ArcadeEntry />
    </Screen>
  );
}
