import { test } from '@playwright/test';
import { ADMIN, REVIEWER, login } from './helpers';

const OUT = process.env.PEACHES_SHOTS;
test.skip(!OUT, 'Set PEACHES_SHOTS=<dir> to capture screenshots');

const WIDTHS = [390, 1280] as const;

async function shoot(page: import('@playwright/test').Page, name: string, width: number) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true });
}

for (const width of WIDTHS) {
  test(`captures member pages at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await shoot(page, 'landing', width);
    await login(page, REVIEWER);
    await page.waitForLoadState('networkidle');
    await shoot(page, 'home', width);
    const profileHref = await page.getByTestId('person-card').first().getAttribute('href');
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await shoot(page, 'explore', width);
    if (width < 600) {
      await page.getByRole('button', { name: 'Filters' }).click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/explore-filters-${width}.png` });
      await page.keyboard.press('Escape');
    }
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    await shoot(page, 'feed', width);
    await page.goto('/inbox');
    await page.waitForLoadState('networkidle');
    await shoot(page, 'inbox', width);
    if (profileHref) {
      await page.goto(profileHref);
      await page.waitForLoadState('networkidle');
      await shoot(page, 'profile', width);
    }
    await page.goto('/me');
    await page.waitForLoadState('networkidle');
    await shoot(page, 'me', width);
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await shoot(page, 'settings', width);
    await page.goto('/inbox');
    await page.getByRole('tab', { name: /^Messages/ }).click();
    await page.getByTestId('thread-row').first().click();
    await page.waitForLoadState('networkidle');
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await page.screenshot({ path: `${OUT}/chat-${width}.png` });
  });

  test(`captures admin pages at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
    await login(page, ADMIN, /\/admin$/);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('dossier').first().click().catch(() => {});
    await page.waitForTimeout(300);
    await shoot(page, 'admin', width);
    await page.goto('/admin/members');
    await page.waitForLoadState('networkidle');
    await shoot(page, 'admin-members', width);
  });
}
