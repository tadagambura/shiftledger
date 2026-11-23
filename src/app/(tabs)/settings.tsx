import { router } from 'expo-router';
import { useState } from 'react';
import { formatGBP } from '@/kit/money';
import { PaywallSheet } from '@/kit/Paywall';
import { usePremium } from '@/kit/premium';
import { KitSettings } from '@/kit/Settings';
import { Card, Chip, Divider, Field, ListRow, Muted, Row, Section, Toggle } from '@/kit/ui';
import { parseTaxCode, type LoanPlan } from '@/domain/tax';
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
