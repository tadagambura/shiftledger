# ShiftLedger

**Know what you'll actually be paid**

> #10 of 33 · Wave 1: Daily keepers · Used: Every shift · Medium · Revenue potential: High · Money & Work
> **Flagship: highest-value app**

## What it is

For zero-hours, agency, hospitality, care, retail and NHS-bank workers. Log shifts across several jobs and see estimated take-home pay, money earned but not yet paid, your expected payday, and whether a payslip looks short.

## Why it's in the portfolio

The highest-value idea in the portfolio: a stressful money problem that comes back every shift and every payday, for a large UK audience that existing apps only partly serve. The strongest case for a subscription. Feeds naturally into PocketLeft (safe to spend) and SubSpot.

## Who it's for

UK hourly workers with variable shifts, especially 18–35s with more than one employer.

**The problem:** With irregular shifts it's hard to know what you'll be paid, when, and whether it's right.

## Version one

- Rota planner: enter upcoming shifts and days off in advance
- Log shifts: rate, overtime, breaks, travel, tips; multiple employers
- Estimated gross and net pay using UK tax and NI for the current tax year
- Earned-but-unpaid total, expected payday and a payslip check that flags possible short pay
- Shift streak: every scheduled shift logged. Days off are marked in advance, freeze the streak and get no reminders

**Example:** A care worker adds next week's rota (four shifts, three days off). After each shift ShiftLedger asks 'log today's shift?', pre-filled; on days off it stays quiet and the streak is safe. They ask 'how much have I made this month?' and get the exact figure.

## Later

- Payslip reconciliation
- Pay forecasts and low-cash warnings
- Bills calendar (links to PocketLeft)
- Holiday-pay estimate
- Import a rota from a photo or calendar

## How it makes money

| Model | Detail |
|---|---|
| Free | Shift logging and pay estimate, with ads |
| Premium | £3.99–£5.99/month: unlimited jobs, payslip checks, forecasts, exports |
| Ads | Light, never on pay screens |

## Why people come back

Built on **The Progression Loop**, the portfolio's shared retention framework
(streaks with forgiveness, visible progress, milestones, recaps, no guilt-trips).

| Stage | In ShiftLedger |
|---|---|
| Cue | End of each scheduled shift, and payday. Nothing on days off. |
| Tiny win | Confirm today's shift in one tap (pre-filled from the rota) |
| Progress | Shift streak (frozen on planned days off), earned this period, unpaid total |
| Share | Low (pay is private); grow through worker communities and content |
| Next step | Each payday: check the payslip, plan the next rota |
| Cadence | Every shift + every payday |

## AI

**Light.** 'Ask' box: 'how much have I made this month?' A cheap model only works out what's being asked; the numbers are always calculated by the app's own code, never by the AI.

## Watch-outs

Tax and NI rules change every April, so estimates must be labelled as estimates and updated yearly. 'Short pay' must read as 'possible discrepancy', not legal advice. Competitors exist (wac, Debly, NetPay UK, ShiftWallet).

## Status

Planning. The build spec is in [`docs/SPEC.md`](docs/SPEC.md).

---

Part of a portfolio of 33 small consumer apps that share one codebase, one retention module
and one marketing system ([growth-engine](https://github.com/tadagambura/growth-engine)).
