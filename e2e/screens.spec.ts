// Captures the core screens for review: SCREENS=1 npx playwright test e2e/screens.spec.ts
import { test } from '@playwright/test';

const out = (n: string) => `../docs/pilots/screens/shiftledger-${n}.png`;

test('screens', async ({ page }) => {
  test.skip(!process.env.SCREENS, 'set SCREENS=1 to capture');
  await page.goto('/');
  await page.getByTestId('intro').waitFor();
  for (let i = 0; i < 3; i++) await page.getByTestId('intro-next').click();
  await page.getByTestId('add-job').click();
  await page.getByTestId('job-name').fill('Café');
  await page.getByTestId('job-rate').fill('12.71');
  await page.getByTestId('job-lag-0').click();
  await page.getByTestId('job-save').click();
  for (const back of [3, 2, 1, 0]) {
    await page.goto('/shift');
    for (let i = 0; i < back; i++) await page.getByTestId('shift-day-prev').click();
    await page.getByTestId('shift-save').click();
  }
  await page.goto('/shift');
  await page.getByTestId('shift-day-next').click();
  await page.getByTestId('shift-save').click();
  await page.goto('/');
  await page.getByTestId('today').waitFor();
  await page.screenshot({ path: out('1-today'), fullPage: true });
  await page.goto('/pay');
  await page.getByTestId('pay').waitFor();
  await page.screenshot({ path: out('2-pay'), fullPage: true });
});
