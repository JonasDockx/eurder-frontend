import { expect, Page, test } from '@playwright/test';
import { fakeBackend, loginAs, withBasket } from './fake-backend';

const navBasket = (page: Page) => page.locator('nav').getByRole('link', { name: /Basket/ });

test.describe('ORBA1 - shop for items', () => {
  test.beforeEach(async ({ page }) => {
    await fakeBackend(page);
  });

  test('ADD TO BASKET gives visual feedback and updates the counters', async ({ page }) => {
    await page.goto('/items/item-3');
    await expect(page.getByRole('link', { name: 'VIEW BASKET (0)' })).toBeVisible();

    await page.getByRole('button', { name: 'ADD TO BASKET' }).click();
    await expect(page.getByRole('status')).toHaveText('Toaster Pro added to basket');
    await expect(page.getByRole('link', { name: 'VIEW BASKET (1)' })).toBeVisible();
    await expect(navBasket(page)).toHaveText('Basket (1)');
  });

  test('adding the same item twice raises its amount', async ({ page }) => {
    await page.goto('/items/item-3');
    await page.getByRole('button', { name: 'ADD TO BASKET' }).click();
    await page.getByRole('button', { name: 'ADD TO BASKET' }).click();
    await page.getByRole('link', { name: /VIEW BASKET/ }).click();

    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByLabel('Amount of Toaster Pro')).toHaveValue('2');
  });

  test('out-of-stock items can still be added', async ({ page }) => {
    await page.goto('/items/item-4'); // Kettle, stock 0
    await page.getByRole('button', { name: 'ADD TO BASKET' }).click();
    await expect(navBasket(page)).toHaveText('Basket (1)');
  });
});

test.describe('ORBA2 - view basket', () => {
  test.beforeEach(async ({ page }) => {
    await fakeBackend(page);
    await withBasket(page, [
      { itemId: 'item-3', name: 'Toaster Pro', unitPrice: 29.99, amount: 1 },
      { itemId: 'item-4', name: 'Kettle', unitPrice: 19.99, amount: 2 },
    ]);
    await page.goto('/basket');
  });

  test('shows name, amount and price (amount x unit price) of every item, and the total', async ({
    page,
  }) => {
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.getByLabel('Amount of Kettle')).toHaveValue('2');
    await expect(page.locator('tbody tr').filter({ hasText: 'Kettle' })).toContainText('€39.98');
    await expect(page.locator('.total')).toHaveText('€69.97');
  });

  test('the amount can be raised; it never goes below 1', async ({ page }) => {
    const amount = page.getByLabel('Amount of Toaster Pro');
    await amount.fill('3');
    await amount.press('Enter');
    await expect(page.locator('.total')).toHaveText('€129.95'); // 3 x 29.99 + 39.98
    await expect(navBasket(page)).toHaveText('Basket (5)');

    await amount.fill('0');
    await amount.press('Enter');
    await expect(amount).toHaveValue('1');
  });

  test('X removes the item from the basket', async ({ page }) => {
    await page.getByRole('button', { name: 'Remove Kettle' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('.total')).toHaveText('€29.99');
  });

  test('the basket survives a page refresh', async ({ page }) => {
    await page.getByRole('button', { name: 'Remove Kettle' }).click();
    await page.reload();
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });
});

test.describe('ORBA3 - place order', () => {
  const twoFridges = [{ itemId: 'item-1', name: 'Fridge Coolio Z', unitPrice: 499.99, amount: 2 }];

  test('success: dialog, basket cleared, back to the item overview', async ({ page }) => {
    const db = await fakeBackend(page);
    await loginAs(page, 'customer');
    await withBasket(page, twoFridges);
    await page.goto('/basket');

    await page.getByRole('button', { name: 'PLACE ORDER' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Your order has been successfully placed.');
    await expect(dialog).toContainText('€999.98');
    expect(db.orders).toEqual([{ itemGroups: [{ itemId: 'item-1', amount: 2 }] }]); // ids + amounts, no prices
    await expect(navBasket(page)).toHaveText('Basket (0)');

    await dialog.getByRole('button', { name: 'Okidoki' }).click();
    await expect(page).toHaveURL('/items');
  });

  test('failure: the user is told why, and the basket is kept', async ({ page }) => {
    await fakeBackend(page, { failOrders: true });
    await loginAs(page, 'customer');
    await withBasket(page, twoFridges);
    await page.goto('/basket');

    await page.getByRole('button', { name: 'PLACE ORDER' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      /Your order could not be placed: Item with id item-1 could not be found/,
    );
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('not logged in: log in first, then you are back at your basket', async ({ page }) => {
    await fakeBackend(page);
    await withBasket(page, twoFridges);
    await page.goto('/basket');

    await page.getByRole('button', { name: 'PLACE ORDER' }).click();
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fbasket/);

    await page.locator('#email').fill('jan@test.com');
    await page.locator('#password').fill('secret');
    await page.getByRole('button', { name: 'LOG IN' }).click();
    await expect(page).toHaveURL('/basket');
    await expect(page.locator('tbody tr')).toHaveCount(1);
  });

  test('admins cannot place orders', async ({ page }) => {
    await fakeBackend(page);
    await loginAs(page, 'admin');
    await withBasket(page, twoFridges);
    await page.goto('/basket');

    await expect(page.getByRole('button', { name: 'PLACE ORDER' })).toBeDisabled();
    await expect(page.getByText('Admins cannot place orders.')).toBeVisible();
  });
});
