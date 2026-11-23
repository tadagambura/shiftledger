import { useState } from 'react';
import { formatDay, todayKey } from '@/kit/dates';
import { MoneyField } from '@/kit/inputs';
import { formatGBP, type Pence } from '@/kit/money';
import { PaywallSheet } from '@/kit/Paywall';
import { usePremium } from '@/kit/premium';
import { Body, Button, Card, Divider, EmptyState, H1, Muted, Note, Row, Screen, Section, Sheet, Stack, Strong } from '@/kit/ui';
import { checkPayslip, nextPayday, payPeriod, previousPayday, type Job, type PayPeriod } from '@/domain/shifts';
import { RULES_CHECKED, TAX_YEAR } from '@/domain/tax';
import { useLedger } from '@/state/ledger';

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Body>{label}</Body>
      <Body>{value}</Body>
    </Row>
  );
}

export default function Pay() {
  const l = useLedger();
  const { isPremium } = usePremium();
  const [checking, setChecking] = useState<{ job: Job; p: PayPeriod } | null>(null);
  const [gross, setGross] = useState<Pence | null>(null);
  const [net, setNet] = useState<Pence | null>(null);
  const [paywall, setPaywall] = useState(false);
  const today = todayKey();
  if (!l.jobs.length) return <Screen><H1>Pay</H1><EmptyState icon="cash-outline" title="No job yet" body="Add your job on the Today tab." /></Screen>;

  return (
    <Screen testID="pay">
      <H1>Pay</H1>
      {l.jobs.map((job) => {
        const next = nextPayday(job, today);
        const paydays = [next, previousPayday(job, next), previousPayday(job, previousPayday(job, next))];
        return (
          <Section key={job.id} title={job.name}>
            {paydays.map((pd) => {
              const p = payPeriod(job, l.shifts, pd, l.setup);
              const slip = l.payslips.find((s) => s.jobId === job.id && s.payday === pd);
              const check = slip ? checkPayslip(slip, p) : null;
              const past = pd <= today;
              return (
                <Card key={pd} testID={`period-${pd}`}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Strong>{`${past ? 'Paid' : 'Payday'} ${formatDay(pd)}`}</Strong>
                    <Muted>{`${p.worked.length + p.planned.length} shifts`}</Muted>
                  </Row>
                  <Line label="Gross" value={formatGBP(p.est.gross)} />
                  <Line label="Income tax" value={`−${formatGBP(p.est.tax)}`} />
                  <Line label="National Insurance" value={`−${formatGBP(p.est.ni)}`} />
                  {p.est.loan ? <Line label="Student loan" value={`−${formatGBP(p.est.loan)}`} /> : null}
                  {p.est.pension ? <Line label="Pension" value={`−${formatGBP(p.est.pension)}`} /> : null}
                  <Divider />
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Strong>Estimated take-home</Strong>
                    <Strong>{formatGBP(p.est.net)}</Strong>
                  </Row>
                  {check ? <Note tone={check.state === 'check' ? 'warning' : 'info'}>{`Payslip: ${formatGBP(slip!.net)} take-home. ${check.message}`}</Note> : null}
                  {past && p.worked.length ? (
                    <Button
                      small
                      variant="secondary"
                      title={slip ? 'Update payslip' : 'Check my payslip'}
                      icon="search-outline"
                      testID={`check-${pd}`}
                      onPress={() => {
                        if (!isPremium) return setPaywall(true);
                        setGross(slip?.gross ?? null);
                        setNet(slip?.net ?? null);
                        setChecking({ job, p });
                      }}
                    />
                  ) : null}
                </Card>
              );
            })}
          </Section>
        );
      })}
      <Muted>{`Estimates use ${TAX_YEAR} UK rates (checked ${formatDay(RULES_CHECKED)}) and treat each payslip on its own, so your real payslip can differ, for example because of your tax code history. Not tax advice.`}</Muted>

      <Sheet visible={!!checking} onClose={() => setChecking(null)} title="Check a payslip">
        <Stack>
          <Body>{checking ? `Payday ${formatDay(checking.p.payday)} for ${checking.job.name}. We estimated ${formatGBP(checking.p.est.gross)} gross and ${formatGBP(checking.p.est.net)} take-home.` : ''}</Body>
          <MoneyField label="Gross pay on the payslip (optional)" value={gross} onChange={setGross} testID="slip-gross" />
          <MoneyField label="Take-home (net) pay" value={net} onChange={setNet} testID="slip-net" />
          <Button
            title="Check it"
            disabled={net == null}
            testID="slip-save"
            onPress={() => {
              if (!checking || net == null) return;
              l.savePayslip({ jobId: checking.job.id, payday: checking.p.payday, gross, net });
              setChecking(null);
            }}
          />
        </Stack>
      </Sheet>
      <PaywallSheet visible={paywall} onClose={() => setPaywall(false)} reason="Payslip checks are part of Premium. Your shift log and pay estimates stay free." />
    </Screen>
  );
}
