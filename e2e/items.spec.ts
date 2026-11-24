import { expect, test } from '@playwright/test';
import { fakeBackend } from './fake-backend';

test.beforeEach(async ({ page }) => {
  await fakeBackend(page);
});

test.describe('IT1 - item overview', () => {
  test('shows every item with its name, price, image and stock urgency', async ({ page }) => {
    await page.goto('/items');

    const cards = page.locator('.card');
    await expect(cards).toHaveCount(4);

    const fridge = cards.filter({ hasText: 'Fridge Coolio Z' });
    await expect(fridge).toContainText('Price: €499.99');
    await expect(fridge.getByRole('img', { name: 'Fridge Coolio Z' })).toBeVisible();
    await expect(fridge.locator('app-stock-badge')).toHaveText('HIGH');
  });

  test('stock urgency: green for high, orange for medium, red for low', async ({ page }) => {
    await page.goto('/items');
    const pin = (name: string) => page.locator('.card').filter({ hasText: name }).locator('.stock');

    await expect(pin('Fridge Coolio Z')).toHaveClass(/STOCK_HIGH/);
    await expect(pin('Freezer Brrr')).toHaveClass(/STOCK_MEDIUM/);
    await expect(pin('Toaster Pro')).toHaveClass(/STOCK_LOW/);
    await expect(pin('Fridge Coolio Z')).toHaveCSS('--pin-color', '#2e9d3a'); // green
    await expect(pin('Freezer Brrr')).toHaveCSS('--pin-color', '#f0a020'); // orange
    await expect(pin('Toaster Pro')).toHaveCSS('--pin-color', '#d93025'); // red
  });

  test('shows a placeholder when the random image cannot be loaded', async ({ page }) => {
    await page.goto('/items');
    const image = page.getByRole('img', { name: 'Kettle' });
    await expect(image).toHaveAttribute('src', 'item-placeholder.svg');
  });
});

test.describe('IT2 - filter items', () => {
  test('filters on name: starts-with and not case-sensitive', async ({ page }) => {
    await page.goto('/items');
    const filter = page.getByLabel('Filter items by name');
    const cards = page.locator('.card');

    await filter.fill('fr');
    await expect(cards).toHaveCount(2); // Fridge + Freezer

    await filter.fill('FRIDGE');
    await expect(cards).toHaveCount(1);
    await expect(cards).toContainText('Fridge Coolio Z');

    await filter.fill('coolio'); // in the name, but not at the start
    await expect(cards).toHaveCount(0);
    await expect(page.getByText('No items start with "coolio".')).toBeVisible();

    await filter.fill('');
    await expect(cards).toHaveCount(4);
  });
});

test.describe('IT5 - item detail', () => {
  test('opens when clicking the name of an item', async ({ page }) => {
    await page.goto('/items');
    await page.locator('.card-title', { hasText: 'Toaster Pro' }).click();

    await expect(page).toHaveURL('/items/item-3');
    await expect(page.getByRole('heading', { name: 'Item item-3' })).toBeVisible();
    await expect(page.locator('#name')).toHaveValue('Toaster Pro');
    await expect(page.locator('#description')).toHaveValue('Makes toast');
    await expect(page.locator('#price')).toHaveValue('29.99');
    await expect(page.locator('#amount')).toHaveValue('2');
  });

  test('opens when clicking the image of an item', async ({ page }) => {
    await page.goto('/items');
    await page.getByRole('img', { name: 'Kettle' }).click();
    await expect(page).toHaveURL('/items/item-4');
  });

  test('opens by typing the url; nothing can be changed', async ({ page }) => {
    await page.goto('/items/item-1');
    await expect(page.locator('#name')).toHaveValue('Fridge Coolio Z');
    for (const id of ['#name', '#description', '#price', '#amount']) {
      await expect(page.locator(id)).not.toBeEditable();
    }
  });

  test('BACK goes to the overview', async ({ page }) => {
    await page.goto('/items/item-1');
    await page.getByRole('link', { name: 'BACK' }).click();
    await expect(page).toHaveURL('/items');
  });

  test('shows the error of the backend for an unknown item', async ({ page }) => {
    await page.goto('/items/nope');
    await expect(page.getByRole('alert')).toHaveText('Item with id nope could not be found');
  });
});
