# ShiftLedger: Spec

**Know what you'll actually be paid** · #21 of 33 in the build order · Medium · Revenue potential: High · Money & Work · Source: Perplexity

## One-liner

For zero-hours, agency, hospitality, care, retail and NHS-bank workers. Log shifts across several jobs and see estimated take-home pay, money earned but not yet paid, your expected payday, and whether a payslip looks short.

## Problem / audience

- **Who it's for:** UK hourly workers with variable shifts, especially 18–35s with more than one employer.
- **The problem it solves:** With irregular shifts it's hard to know what you'll be paid, when, and whether it's right.
- **Example:** A care worker logs three shifts across two agencies and sees expected take-home pay, what's still unpaid, and whether they can cover an upcoming bill.

## MVP features (ship with only these)

1. Log shifts: rate, overtime, breaks, travel, tips; multiple employers
2. Estimated gross and net pay using UK tax and NI for the current tax year
3. Earned-but-unpaid total and expected payday
4. Payslip check: flags possible missing or short pay
5. Export a shift and pay record

## Not in MVP

- Payslip reconciliation
- Pay forecasts and low-cash warnings
- Bills calendar (links to PocketLeft)
- Holiday-pay estimate

## Monetisation

| Model | Detail |
|---|---|
| Free | Shift logging and pay estimate, with ads |
| Premium | £3.99–£5.99/month: unlimited jobs, payslip checks, forecasts, exports |
| Ads | Light, never on pay screens |

Prices are starting points; test before committing.

## Retention: The Progression Loop

| Stage | Design |
|---|---|
| Cue | After each shift ('log today's shift?') and on payday |
| Tiny win | Log a shift in a few taps |
| Progress | Earned this period; unpaid total |
| Share | Low (pay is private); grow through worker communities and content |
| Next step | Each payday: check the payslip, start a new period |
| Cadence | Every shift + every payday |

Follow the portfolio guardrails: no guilt-trip notifications, no fake urgency, progress is
never wiped, at most one notification a day by default.

## Platform & data

- **Platform:** Expo app.
- **Data:** On the device only.
- **Stack:** shared portfolio foundation (Expo, PostHog, RevenueCat, AdMob, shared Progression Loop module).

## Growth engine

- **Content pillars:** Shift-worker money; Payslips explained; Know your pay (general info); Side-income tax basics
- **Shareable output:** Low (pay is private); grow through worker communities and content

## Risks

Tax and NI rules change every April, so estimates must be labelled as estimates and updated yearly. 'Short pay' must read as 'possible discrepancy', not legal advice. Competitors exist (wac, Debly, NetPay UK, ShiftWallet).

## Launch checklist

- [ ] Name checked on the App Store, Play Store and a trademark search
- [ ] MVP features done and tested
- [ ] Progression Loop wired (cue, tiny win, progress, milestone, next step)
- [ ] Privacy policy and terms
- [ ] Landing page
- [ ] Analytics wired (D1/D7/D30 retention)
- [ ] Payments / ads wired
- [ ] Added to growth-engine as an app config
