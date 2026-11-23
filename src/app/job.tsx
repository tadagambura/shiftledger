import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { track } from '@/kit/analytics';
import { addDays, todayKey } from '@/kit/dates';
import { DateStepper, MoneyField } from '@/kit/inputs';
import type { Pence } from '@/kit/money';
import { Button, Chip, Field, Muted, Note, Row, Section, Screen, Segmented } from '@/kit/ui';
import { nextPayday } from '@/domain/shifts';
import type { Frequency } from '@/domain/tax';
import { useLedger } from '@/state/ledger';

const FREQS: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'fortnightly', label: '2-weekly' },
  { value: 'fourweekly', label: '4-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function JobScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useLedger((s) => s.jobs.find((j) => j.id === id));
  const today = todayKey();
  const [name, setName] = useState(existing?.name ?? '');
  const [rate, setRate] = useState<Pence | null>(existing?.rate ?? null);
  const [frequency, setFrequency] = useState<Frequency>(existing?.frequency ?? 'weekly');
  const [payday, setPayday] = useState(existing ? nextPayday(existing, today) : addDays(today, 4));
  const [lag, setLag] = useState(existing?.lagDays ?? 7);
  const [err, setErr] = useState<string | null>(null);

  const save = () => {
    if (!name.trim()) return setErr('What should we call this job?');
    if (!rate) return setErr('Enter your hourly rate.');
    useLedger.getState().saveJob({ id: existing?.id, name: name.trim(), rate, frequency, anchor: payday, lagDays: lag });
    if (!existing) track('core_action_completed', { what: 'job_added', frequency });
    router.back();
  };

  return (
    <Screen edges={['bottom']} testID="job" footer={<Button title="Save job" onPress={save} testID="job-save" />}>
      <Field label="Job name" value={name} onChangeText={setName} placeholder="e.g. Café, Agency, NHS bank" maxLength={30} testID="job-name" />
      <MoneyField label="Hourly rate" value={rate} onChange={setRate} hint="The National Living Wage is £12.71 an hour from April 2026 (21 and over)." testID="job-rate" />
      <Segmented label="How often you're paid" options={FREQS} value={frequency} onChange={setFrequency} testID="job-frequency" />
      <DateStepper label="Your next payday" value={payday} onChange={setPayday} min={today} max={addDays(today, 62)} testID="job-payday" />
      <Section title="Paid in arrears?">
        <Muted>Many jobs pay for work up to a week or two before payday.</Muted>
        <Row wrap gap={8}>
          {[0, 7, 14].map((d) => (
            <Chip key={d} label={d === 0 ? 'Up to payday' : `${d / 7} week${d > 7 ? 's' : ''} behind`} selected={lag === d} onPress={() => setLag(d)} testID={`job-lag-${d}`} />
          ))}
        </Row>
      </Section>
      {err ? <Note tone="warning">{err}</Note> : null}
    </Screen>
  );
}
