import { expect, type Page } from '@playwright/test';

export const REVIEWER = { email: 'review@peaches.app', password: 'review123' };
export const ADMIN = { email: 'admin@admin.local', password: 'admin' };

export async function login(page: Page, who: { email: string; password: string }, expectPath: RegExp = /\/home$/) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(who.email);
  await page.getByLabel('Password', { exact: true }).fill(who.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(expectPath, { timeout: 20_000 });
}
