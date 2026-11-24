import { expect, test } from '@playwright/test';
import { fakeBackend } from './fake-backend';

test.beforeEach(async ({ page }) => {
  await fakeBackend(page);
});

test('a wrong password shows the error of the backend', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('admin@eurder.com');
  await page.locator('#password').fill('wrong');
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await expect(page.getByRole('alert')).toHaveText('Wrong email or password');
});

test('an admin logs in, sees the admin links, and logs out again', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#email').fill('admin@eurder.com');
  await page.locator('#password').fill('admin');
  await page.getByRole('button', { name: 'LOG IN' }).click();

  await expect(page).toHaveURL('/items');
  const nav = page.locator('nav');
  await expect(nav.getByRole('link', { name: 'Customers' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'New item' })).toBeVisible();

  await nav.getByRole('button', { name: 'Log out' }).click();
  await expect(nav.getByRole('link', { name: 'Customers' })).toHaveCount(0);
  await expect(nav.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('admin pages send you to the login page, and back after logging in', async ({ page }) => {
  await page.goto('/items/new');
  await expect(page).toHaveURL(/\/login\?returnUrl=%2Fitems%2Fnew/);

  await page.locator('#email').fill('admin@eurder.com');
  await page.locator('#password').fill('admin');
  await page.getByRole('button', { name: 'LOG IN' }).click();
  await expect(page).toHaveURL('/items/new');
});

test('registering yourself logs you in as that customer', async ({ page }) => {
  await page.goto('/items');
  await page.locator('nav').getByRole('link', { name: 'Register' }).click();

  await page.locator('#firstName').fill('Nina');
  await page.locator('#lastName').fill('Nieuw');
  await page.getByLabel('Email, part before the @').fill('nina');
  await page.getByLabel('Email, domain after the @').fill('test.com');
  await page.locator('#password').fill('secret');
  await page.locator('#phoneNumber').fill('470 12 31 23');
  await page.locator('#street').fill('Stationsstraat');
  await page.locator('#houseNumber').fill('1');
  await page.locator('#postalCode').fill('2000');
  await page.locator('#city').fill('Antwerpen');
  await page.getByRole('button', { name: 'CREATE' }).click();

  await expect(page).toHaveURL('/items');
  await expect(page.locator('nav').getByRole('button', { name: 'Log out' })).toBeVisible();
});
