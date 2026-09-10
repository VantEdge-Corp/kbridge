import { expect, test } from '@playwright/test';
import { ADMIN, REVIEWER, login } from './helpers';

test.describe('public', () => {
  test('landing renders the wordmark and Apply', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('PEACHES').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'People worth meeting.' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Apply', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
  });

  test('the apply form submits and lands on the status page', async ({ page }) => {
    await page.goto('/apply');
    const email = `e2e-${Date.now()}@peaches.test`;
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('First name', { exact: true }).fill('Casey');
    await page.getByLabel('Age', { exact: true }).fill('29');
    await page.getByLabel('Area', { exact: true }).selectOption({ label: 'Decatur' });
    await page.getByLabel('Occupation', { exact: true }).fill('Landscape architect');
    await page.getByLabel('Employer', { exact: true }).fill('Perkins&Will');
    await page.getByLabel(/Why Peaches/).fill('I would rather be introduced than browsed, and I am ready for something real.');
    await page.getByLabel(/18 years of age/).check();
    await page.getByLabel(/read and agree/).check();
    await page.getByRole('button', { name: 'Submit application' }).click();
    await expect(page).toHaveURL(/\/status\/[a-f0-9]+$/, { timeout: 20_000 });
    const status = page.getByTestId('status-page');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('data-status', 'pending');
    await expect(page.getByText('Keep this link')).toBeVisible();
  });

  test('legal pages render from the shared documents', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
  });
});

test.describe('member', () => {
  test('home shows the four sections and person cards', async ({ page }) => {
    await login(page, REVIEWER);
    for (const label of ['For You', 'Nearby', 'New', 'Active']) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible();
    }
    await expect(page.getByTestId('person-card').first()).toBeVisible();
    expect(await page.getByTestId('person-card').count()).toBeGreaterThan(3);
    await page.getByRole('tab', { name: 'Active' }).click();
    await expect(page.getByRole('tab', { name: 'Active' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('body')).not.toContainText(/popular|trending|top picks|hot/i);
  });

  test('explore changes a preference strength and shows a result count', async ({ page }) => {
    await login(page, REVIEWER);
    await page.goto('/explore');
    const count = page.getByTestId('explore-count');
    await expect(count).toHaveText(/\d+ (people|person)/);
    const group = page.getByRole('radiogroup', { name: 'Age strength' });
    await expect(group).toBeVisible();
    const currentlyRequired = (await group.getByRole('radio', { name: 'Required' }).getAttribute('aria-checked')) === 'true';
    const target = currentlyRequired ? 'Preferred' : 'Required';
    await group.getByRole('radio', { name: target }).click();
    await expect(group.getByRole('radio', { name: target })).toHaveAttribute('aria-checked', 'true');
    await expect(count).toHaveText(/\d+ (people|person)/);
    const save = page.getByRole('button', { name: 'Save preferences' });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 20_000 });
  });

  test('explore filters open as a sheet on a phone-sized screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, REVIEWER);
    await page.goto('/explore');
    await page.getByRole('button', { name: 'Filters' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('radiogroup', { name: 'Nationality strength' })).toBeVisible();
    await dialog.getByRole('button', { name: /^Nationality:/ }).click();
    const inner = page.getByRole('dialog').last();
    await expect(inner.getByLabel('Search Nationality')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('feed lists posts', async ({ page }) => {
    await login(page, REVIEWER);
    await page.goto('/feed');
    await expect(page.getByTestId('post-card').first()).toBeVisible();
    expect(await page.getByTestId('post-card').count()).toBeGreaterThan(2);
    await expect(page.getByRole('link', { name: 'Post' })).toBeVisible();
  });

  test('inbox shows its three sections and opens a chat', async ({ page }) => {
    await login(page, REVIEWER);
    await page.goto('/inbox');
    for (const label of ['Requests', 'Connections', 'Messages']) {
      await expect(page.getByRole('tab', { name: new RegExp(`^${label}`) })).toBeVisible();
    }
    await expect(page.getByTestId('request-row').first()).toBeVisible();
    await page.getByRole('tab', { name: /^Messages/ }).click();
    await page.getByTestId('thread-row').first().click();
    await expect(page).toHaveURL(/\/chat\//);
    await expect(page.getByTestId('chat')).toBeVisible();
    await expect(page.getByLabel('Message', { exact: true })).toBeVisible();
  });

  test('profile view opens from a card and shows the Interested action', async ({ page }) => {
    await login(page, REVIEWER);
    await page.getByTestId('person-card').first().click();
    await expect(page).toHaveURL(/\/profile\//);
    await expect(page.getByTestId('profile-view')).toBeVisible();
    await expect(page.getByTestId('interested')).toBeVisible();
    await page.getByTestId('interested').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('me shows completeness and the settings gear', async ({ page }) => {
    await login(page, REVIEWER);
    await page.goto('/me');
    await expect(page.getByTestId('completeness')).toHaveText(/\d+%/);
    await page.getByTestId('settings-gear').click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByTestId('settings')).toBeVisible();
    for (const label of ['Account', 'Privacy', 'Discovery Preferences', 'Notifications', 'Verification', 'Blocked Users', 'Safety', 'Data & Account', 'Logout']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });
});

test.describe('admin', () => {
  test('the committee reaches the applications queue', async ({ page }) => {
    await login(page, ADMIN, /\/admin$/);
    await expect(page.getByTestId('admin-applications')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Pending' })).toBeVisible();
    await page.getByRole('link', { name: 'Members' }).click();
    await expect(page.getByTestId('admin-members')).toBeVisible();
    await expect(page.getByTestId('member-card').first()).toBeVisible();
    await page.getByRole('link', { name: 'Reports' }).click();
    await expect(page.getByTestId('admin-reports')).toBeVisible();
  });
});
