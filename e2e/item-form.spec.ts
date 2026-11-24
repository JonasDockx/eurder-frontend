import { expect, test } from '@playwright/test';
import { fakeBackend, loginAs } from './fake-backend';

test.beforeEach(async ({ page }) => {
  await fakeBackend(page);
  await loginAs(page, 'admin');
});

test.describe('IT3 - create item', () => {
  test('shows red validation messages and sends nothing', async ({ page }) => {
    await page.goto('/items/new');
    await page.locator('#price').fill('-1');
    await page.locator('#amount').fill('2.5');
    await page.getByRole('button', { name: 'CREATE' }).click();

    await expect(page.getByText('Name is required.')).toBeVisible();
    await expect(page.getByText('Description is required.')).toBeVisible();
    await expect(page.getByText('Price cannot be negative.')).toBeVisible();
    await expect(page.getByText('Stock must be a whole number.')).toBeVisible();
    await expect(page.getByText('Name is required.')).toHaveCSS('color', 'rgb(211, 47, 47)'); // red
    await expect(page).toHaveURL('/items/new');
  });

  test('negative stock is not allowed', async ({ page }) => {
    await page.goto('/items/new');
    await page.locator('#amount').fill('-5');
    await page.getByRole('button', { name: 'CREATE' }).click();
    await expect(page.getByText('Stock cannot be negative.')).toBeVisible();
  });

  test('creates the item and redirects to its detail page', async ({ page }) => {
    await page.goto('/items/new');
    await page.locator('#name').fill('Microwave');
    await page.locator('#description').fill('Heats things up');
    await page.locator('#price').fill('89.95');
    await page.locator('#amount').fill('12');
    await page.getByRole('button', { name: 'CREATE' }).click();

    await expect(page).toHaveURL(/\/items\/item-\d+$/);
    await expect(page.locator('#name')).toHaveValue('Microwave');
    await expect(page.locator('#price')).toHaveValue('89.95');
  });
});

test.describe('IT4 - description counter', () => {
  test('counts down by 1 for every character', async ({ page }) => {
    await page.goto('/items/new');
    const counter = page.locator('app-char-counter');
    await expect(counter).toHaveText('255 / 255');

    await page.locator('#description').fill('Hello');
    await expect(counter).toHaveText('250 / 255');
  });

  test('stays at 0, turns red and makes the field invalid when there is too much text', async ({
    page,
  }) => {
    await page.goto('/items/new');
    const counter = page.locator('app-char-counter span');
    const description = page.locator('#description');

    await description.fill('a'.repeat(255));
    await expect(counter).toHaveText('0 / 255');
    await expect(counter).toHaveCSS('color', 'rgb(211, 47, 47)');

    await description.fill('a'.repeat(300));
    await description.blur();
    await expect(counter).toHaveText('0 / 255');
    await expect(description).toHaveClass(/ng-invalid/);
    await expect(page.getByText(/Description can be at most 255 characters/)).toBeVisible();
  });

  test('CANCEL goes back to the overview', async ({ page }) => {
    await page.goto('/items/new');
    await page.getByRole('button', { name: 'CANCEL' }).click();
    await expect(page).toHaveURL('/items');
  });
});

test.describe('IT6 - update item', () => {
  test('EDIT on the detail page opens the filled-in form; the id cannot be edited', async ({
    page,
  }) => {
    await page.goto('/items/item-2');
    await page.getByRole('link', { name: 'EDIT' }).click();

    await expect(page).toHaveURL('/items/item-2/edit');
    await expect(page.locator('#name')).toHaveValue('Freezer Brrr');
    await expect(page.getByRole('heading', { name: 'Item item-2' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'item-2' })).toHaveCount(0); // no field for the id
    await expect(page.locator('app-char-counter')).toHaveText(
      `${255 - 'Keeps things very cold'.length} / 255`,
    );
  });

  test('UPDATE saves (instead of creating a new item) and shows the changes on the detail page', async ({
    page,
  }) => {
    await page.goto('/items/item-2/edit');
    await expect(page.locator('#name')).toHaveValue('Freezer Brrr');
    await page.locator('#name').fill('Freezer Brrr 2000');
    await page.locator('#amount').fill('3');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page).toHaveURL('/items/item-2');
    await expect(page.locator('#name')).toHaveValue('Freezer Brrr 2000');
    await expect(page.locator('#amount')).toHaveValue('3');
    await expect(page.locator('app-stock-badge')).toHaveText('LOW');

    await page.goto('/items');
    await expect(page.locator('.card')).toHaveCount(4); // still 4: nothing was added
  });

  test('validation still applies', async ({ page }) => {
    await page.goto('/items/item-2/edit');
    await expect(page.locator('#name')).toHaveValue('Freezer Brrr');
    await page.locator('#name').fill('');
    await page.locator('#price').fill('-3');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page.getByText('Name is required.')).toBeVisible();
    await expect(page.getByText('Price cannot be negative.')).toBeVisible();
    await expect(page).toHaveURL('/items/item-2/edit');
  });

  test('CANCEL goes back to the detail page', async ({ page }) => {
    await page.goto('/items/item-2/edit');
    await page.getByRole('button', { name: 'CANCEL' }).click();
    await expect(page).toHaveURL('/items/item-2');
  });
});
