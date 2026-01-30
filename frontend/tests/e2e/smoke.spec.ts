import { test, expect } from '@playwright/test';

test('landing page shows mode selection', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Game Show' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Host Mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Player Mode' })).toBeVisible();
});
