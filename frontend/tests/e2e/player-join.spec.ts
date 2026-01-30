import { test, expect } from '@playwright/test';
import { createGame } from './helpers';

test('player can join a game and see team header', async ({ page }) => {
  const game = await createGame();

  await page.goto('/');
  await page.getByRole('button', { name: 'Player Mode' }).click();

  await page.getByPlaceholder('ABCD-EFGH').fill(game.gameCode);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByText('Select Your Team')).toBeVisible();
  await page.getByRole('button', { name: game.teams[0].name }).click();
  await page.getByPlaceholder('Enter your name').fill('Player One');
  await page.getByRole('button', { name: 'Join Game' }).click();

  await expect(page.getByText('Team')).toBeVisible();
  await expect(page.getByText(game.teams[0].name)).toBeVisible();
});
