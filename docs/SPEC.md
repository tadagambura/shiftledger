# ShiftLedger: Spec

**Know what you'll actually be paid** · #9 of 31 · Wave 1: Daily keepers · Used: Every shift · Medium · Revenue potential: High · Money & Work · Source: Perplexity

## One-liner

For zero-hours, agency, hospitality, care, retail and NHS-bank workers. Log shifts across several jobs and see estimated take-home pay, money earned but not yet paid, your expected payday, and whether a payslip looks short.

## Problem / audience

- **Who it's for:** UK hourly workers with variable shifts, especially 18–35s with more than one employer.
- **The problem it solves:** With irregular shifts it's hard to know what you'll be paid, when, and whether it's right.
- **Example:** A care worker adds next week's rota (four shifts, three days off). After each shift ShiftLedger asks 'log today's shift?', pre-filled; on days off it stays quiet and the streak is safe. They ask 'how much have I made this month?' and get the exact figure.

## MVP features (ship with only these)

1. Rota planner: enter upcoming shifts and days off in advance
2. Log shifts: rate, overtime, breaks, travel, tips; multiple employers
3. Estimated gross and net pay using UK tax and NI for the current tax year
4. Earned-but-unpaid total, expected payday and a payslip check that flags possible short pay
5. Shift streak: every scheduled shift logged. Days off are marked in advance, freeze the streak and get no reminders

## Not in MVP

- Payslip reconciliation
- Pay forecasts and low-cash warnings
- Bills calendar (links to PocketLeft)
- Holiday-pay estimate
- Import a rota from a photo or calendar

## Monetisation

| Model | Detail |
|---|---|
| Free | Shift logging and pay estimate, with ads |
| Premium | £3.99–£5.99/month: unlimited jobs, payslip checks, forecasts, exports |
| Ads | Light, never on pay screens |

Prices are starting points; test before committing. **Portfolio premium promise:** free has ads; the moment you pay you get no ads, cloud backup and storage, and sync across your devices, plus this app's extras.

## Retention: The Progression Loop

| Stage | Design |
|---|---|
| Cue | End of each scheduled shift, and payday. Nothing on days off. |
| Tiny win | Confirm today's shift in one tap (pre-filled from the rota) |
| Progress | Shift streak (frozen on planned days off), earned this period, unpaid total |
| Share | Low (pay is private); grow through worker communities and content |
| Next step | Each payday: check the payslip, plan the next rota |
| Cadence | Every shift + every payday |

Follow the portfolio guardrails: no guilt-trip notifications, no fake urgency, progress is
never wiped, at most one notification a day by default.

## Animation and tone: five signature animations

**Calm.** Gentle, kind humour and smooth motion: a stickman yawning after a shift, a fly escaping an empty pocket. No drama, nothing that adds stress.

- End of shift: the clock spins, the stickman stretches and yawns, earnings count up
- Planned day off: the stickman naps in a hammock while a snowflake keeps the streak safe
- Payday: the payslip prints and he checks it with a magnifying glass
- Possible short pay: he raises one eyebrow and taps the number (no alarms)
- Overtime logged: he refills his coffee and the steam spells 'OT'

**Line we don't cross:** Pay is serious: no characters, jokes or drama.

## AI

**Light.** 'Ask' box: 'how much have I made this month?' A cheap model only works out what's being asked; the numbers are always calculated by the app's own code, never by the AI. (Portfolio rule: plain code first, code does the maths,
cheapest model, shared budget cap, premium-gated.)

## Platform & data

- **Platform:** Expo app.
- **Data:** On the device only.
- **Backend:** AI proxy for the premium 'Ask' box. Premium backup and sync use the shared portfolio backend (see the master repo's HOSTING.md).
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
- [ ] Added to the Growth & Maintenance Engine as an app config
