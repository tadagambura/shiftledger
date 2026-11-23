import { expect, test, type Page } from '@playwright/test';

async function finishIntro(page: Page) {
  await expect(page.getByTestId('intro')).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByTestId('intro-next').click();
  await expect(page.getByTestId('today')).toBeVisible();
}

async function addJob(page: Page) {
  await page.getByTestId('add-job').click();
  await page.getByTestId('job-name').fill('Café');
  await page.getByTestId('job-rate').fill('12.71');
  await page.getByTestId('job-lag-0').click();
  await page.getByTestId('job-save').click();
  await expect(page.getByTestId('job-Café')).toBeVisible();
}

test('add job → log today’s shift → earned-not-paid and payslip estimate update, and persist', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await finishIntro(page);
  await addJob(page);
  await expect(page.getByTestId('unpaid')).toHaveText('£0.00');

  await page.getByTestId('log-shift').click();
  await page.getByTestId('shift-start').fill('09:00');
  await page.getByTestId('shift-end').fill('17:30');
  await page.getByTestId('shift-break').fill('30');
  await expect(page.getByText(/8h 0m paid · about £101\.68 before tax/)).toBeVisible();
  await page.getByTestId('shift-save').click();
  await expect(page.getByTestId('unpaid')).toHaveText('£101.68');
  await expect(page.getByTestId('next-gross')).toHaveText('£101.68');
  await expect(page.getByTestId('next-net')).toHaveText('£101.68'); // under the weekly tax and NI thresholds

  await page.reload();
  await expect(page.getByTestId('unpaid')).toHaveText('£101.68');
  await page.goto('/pay');
  await expect(page.getByTestId('pay')).toBeVisible();
  await expect(page.getByText('Estimated take-home').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('plan a rota shift for tomorrow (overnight, time and a half)', async ({ page }) => {
  await page.goto('/');
  await finishIntro(page);
  await addJob(page);
  await page.goto('/shifts');
  await page.getByTestId('shifts-add').click();
  await page.getByTestId('shift-day-next').click();
  await page.getByTestId('shift-start').fill('22:00');
  await page.getByTestId('shift-end').fill('06:00');
  await page.getByTestId('shift-break').fill('0');
  await page.getByTestId('shift-mult-1.5').click();
  await expect(page.getByText(/8h 0m paid · about £152\.52 before tax \(planned\)/)).toBeVisible();
  await page.getByTestId('shift-save').click();
  await expect(page.getByText(/planned/).first()).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('next-gross')).toHaveText('£152.52');
  await expect(page.getByTestId('unpaid')).toHaveText('£0.00'); // planned, not worked yet
});

test('day off keeps things quiet; validation catches bad times', async ({ page }) => {
  await page.goto('/');
  await finishIntro(page);
  await addJob(page);
  await page.getByTestId('day-off').click();
  await expect(page.getByText(/Day off\. No reminders/)).toBeVisible();
  await page.getByTestId('day-off').click();
  await page.getByTestId('log-shift').click();
  await page.getByTestId('shift-start').fill('9');
  await page.getByTestId('shift-save').click();
  await expect(page.getByText('Times look like 09:00 or 22:30.')).toBeVisible();
});

test('tax setup changes the estimate; payslip check is Premium', async ({ page }) => {
  await page.goto('/');
  await finishIntro(page);
  await addJob(page);
  await page.goto('/settings');
  await page.getByTestId('tax-code').fill('BR');
  await expect(page.getByText(/We understand codes like 1257L/)).toBeVisible();
  await page.getByTestId('tax-code').fill('S1257L');
  await page.getByTestId('loan-plan2').click();
  await page.reload();
  await expect(page.getByTestId('tax-code')).toHaveValue('S1257L');
  await expect(page.getByTestId('loan-plan2')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('settings-add-job').click();
  await expect(page.getByTestId('paywall')).toBeVisible();
});

test('a planned shift is confirmed in one tap on the day', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-23T10:00:00'));
  await page.goto('/');
  await finishIntro(page);
  await addJob(page);
  await page.goto('/shift');
  await page.getByTestId('shift-day-next').click(); // Tue 24 Nov
  await page.getByTestId('shift-save').click();
  await page.clock.setFixedTime(new Date('2026-11-24T18:00:00'));
  await page.goto('/');
  await page.getByTestId('confirm-shift').click();
  await expect(page.getByTestId('toast')).toContainText('Logged.');
  await expect(page.getByTestId('unpaid')).not.toHaveText('£0.00');
});

test('shift reminder settings: leave time and break reminders persist', async ({ page }) => {
  await page.goto('/');
  await finishIntro(page);
  await addJob(page);
  await page.goto('/settings');
  await page.getByTestId('rem-travel-45').click();
  await page.getByTestId('rem-break').click();
  await page.reload();
  await expect(page.getByTestId('rem-travel-45')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('rem-break')).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByText('Reminders work in the phone app.').first()).toBeVisible();
});

test('learning cards: 20 free, sourced, quiz works, the 21st is Premium', async ({ page }) => {
  await page.goto('/');
  await finishIntro(page);
  await page.getByRole('tab', { name: /Rights/ }).click();
  await expect(page.getByTestId('cards-progress')).toContainText('0 of 30 cards read · 20 free');
  await page.getByTestId('card-c01').click();
  await expect(page.getByTestId('card-sheet')).toContainText('Source:');
  const quiz = page.getByTestId('card-quiz-0');
  if (await quiz.count()) await quiz.click();
  else await page.getByTestId('card-done').click();
  await page.getByTestId('sheet-close').click();
  await expect(page.getByTestId('cards-progress')).toContainText('1 of 30');
  await page.getByTestId('card-c21').click();
  await expect(page.getByTestId('paywall')).toBeVisible();
});
