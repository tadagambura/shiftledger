import { router } from 'expo-router';
import { useState } from 'react';
import { formatGBP } from '@/kit/money';
import { PaywallSheet } from '@/kit/Paywall';
import { usePremium } from '@/kit/premium';
import { KitSettings } from '@/kit/Settings';
import { Card, Chip, Divider, Field, ListRow, Muted, Row, Section, Toggle } from '@/kit/ui';
import { parseTaxCode, type LoanPlan } from '@/domain/tax';
import { todayKey } from '@/kit/dates';
import { remindersSupported, syncScheduled } from '@/kit/reminders';
import { useFeedback } from '@/kit/feedback';
import { PREFIX, shiftReminders } from '@/domain/reminders';
import { FREE_JOBS } from '@/brand';
import { useLedger } from '@/state/ledger';

const LOANS: { value: LoanPlan; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'plan1', label: 'Plan 1' },
  { value: 'plan2', label: 'Plan 2' },
  { value: 'plan4', label: 'Plan 4' },
  { value: 'plan5', label: 'Plan 5' },
];

export default function Settings() {
  const l = useLedger();
  const { isPremium } = usePremium();
  const { toast } = useFeedback();
  const [code, setCode] = useState(`${l.setup.region === 'scotland' ? 'S' : ''}${l.setup.codeNumber}L`);
  const [pension, setPension] = useState(String(l.setup.pensionPct));
  const [paywall, setPaywall] = useState(false);
  const parsed = parseTaxCode(code);

  return (
    <KitSettings reminder={{ title: 'ShiftLedger', body: "Finished your shift? Confirm it in one tap.", explain: 'One evening reminder. Silent on days you mark as off.' }}>
      <Section title="Jobs">
        <Card>
          {l.jobs.map((j, i) => (
            <ListRow key={j.id} icon="briefcase-outline" title={j.name} subtitle={`${formatGBP(j.rate)} an hour · ${j.frequency}`} onPress={() => router.push(`/job?id=${j.id}`)} testID={`settings-job-${i}`} />
          ))}
          <ListRow icon="add" title="Add another job" testID="settings-add-job" onPress={() => (!isPremium && l.jobs.length >= FREE_JOBS ? setPaywall(true) : router.push('/job'))} />
        </Card>
      </Section>
      <Section title="Shift reminders">
        <Card>
          <Toggle label="Time to leave" hint={`A nudge ${l.reminders.travelMins} minutes before each shift, to catch your bus or train.`} value={l.reminders.leave} onChange={(v) => l.setReminders({ leave: v })} testID="rem-leave" />
          {l.reminders.leave ? (
            <Row wrap gap={8}>
              {[15, 30, 45, 60, 90].map((m) => (
                <Chip key={m} label={`${m} min`} selected={l.reminders.travelMins === m} onPress={() => l.setReminders({ travelMins: m })} testID={`rem-travel-${m}`} />
              ))}
            </Row>
          ) : null}
          <Toggle label="Take your break" hint="On shifts over 6 hours, a reminder 4 hours in. You're entitled to at least 20 minutes." value={l.reminders.breaks} onChange={(v) => l.setReminders({ breaks: v })} testID="rem-break" />
          <Toggle label="Check next week's rota" hint="Sundays at 6pm." value={l.reminders.weeklyRota} onChange={(v) => l.setReminders({ weeklyRota: v })} testID="rem-rota" />
          {remindersSupported ? (
            <ListRow
              icon="notifications-outline"
              title="Allow shift notifications"
              onPress={async () => {
                const n = await syncScheduled(PREFIX, shiftReminders(l.shifts, l.jobs, l.reminders, todayKey()), true);
                toast(n ? `${n} reminders set for the next two weeks.` : 'No upcoming shifts yet, or notifications are off in your phone settings.');
              }}
            />
          ) : (
            <Muted>Reminders work in the phone app.</Muted>
          )}
        </Card>
      </Section>

      <Section title="Tax and deductions">
        <Card>
          <Field
            label="Tax code"
            value={code}
            onChangeText={(t) => {
              setCode(t);
              const p = parseTaxCode(t);
              if (p) l.setSetup(p);
            }}
            autoCapitalize="characters"
            maxLength={10}
            hint="On your payslip, e.g. 1257L (Scotland: S1257L)."
            error={code && !parsed ? 'We understand codes like 1257L or S1257L. Others are estimated as 1257L.' : null}
            testID="tax-code"
          />
          <Divider />
          <Muted>Student loan</Muted>
          <Row wrap gap={8}>
            {LOANS.map((x) => (
              <Chip key={x.value} label={x.label} selected={l.setup.loan === x.value} onPress={() => l.setSetup({ loan: x.value })} testID={`loan-${x.value}`} />
            ))}
          </Row>
          <Toggle label="Postgraduate loan" value={l.setup.postgrad} onChange={(v) => l.setSetup({ postgrad: v })} />
          <Field
            label="Workplace pension (% you pay)"
            value={pension}
            onChangeText={(t) => {
              setPension(t);
              const n = Number(t);
              if (t.trim() !== '' && n >= 0 && n <= 20) l.setSetup({ pensionPct: n });
            }}
            inputMode="decimal"
            keyboardType="decimal-pad"
            maxLength={4}
            hint="Usually 5% if you were auto-enrolled. 0 if you opted out."
            testID="pension"
          />
        </Card>
      </Section>
      <PaywallSheet visible={paywall} onClose={() => setPaywall(false)} reason="Free ShiftLedger tracks one job. Premium handles every job you work." />
    </KitSettings>
  );
}
