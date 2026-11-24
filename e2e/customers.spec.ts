import { expect, Page, test } from '@playwright/test';
import { fakeBackend, loginAs } from './fake-backend';

test.beforeEach(async ({ page }) => {
  await fakeBackend(page);
  await loginAs(page, 'admin');
});

const rows = (page: Page) => page.locator('tbody tr');

/** Fills in the create/update customer form */
async function fillCustomer(
  page: Page,
  data: { email: string; lastName?: string; country?: string },
) {
  const [user, domain] = data.email.split('@');
  await page.locator('#firstName').fill('Lotte');
  await page.locator('#lastName').fill(data.lastName ?? 'Lambrechts');
  await page.getByLabel('Email, part before the @').fill(user);
  await page.getByLabel('Email, domain after the @').fill(domain);
  if (await page.locator('#password').count()) {
    await page.locator('#password').fill('secret');
  }
  await page.getByLabel('Country code').fill('32');
  await page.locator('#phoneNumber').fill('470 99 88 77');
  await page.locator('#street').fill('Kerkstraat');
  await page.locator('#houseNumber').fill('12');
  await page.locator('#postalCode').fill('3000');
  await page.locator('#city').fill('Leuven');
  await page.locator('#country').selectOption(data.country ?? 'Belgium');
}

test.describe('CU1 - customer overview', () => {
  test('shows id, firstname and lastname of every customer', async ({ page }) => {
    await page.goto('/customers');
    await expect(rows(page)).toHaveCount(3);
    await expect(rows(page).first()).toContainText('cust-1');
    await expect(rows(page).first()).toContainText('Jan');
    await expect(rows(page).first()).toContainText('Janssens');
  });

  test('has NEW CUSTOMER, VIEW and EDIT buttons', async ({ page }) => {
    await page.goto('/customers');
    await expect(page.getByRole('link', { name: 'NEW CUSTOMER' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'VIEW' })).toHaveCount(3);
    await expect(page.getByRole('link', { name: 'EDIT' })).toHaveCount(3);
  });

  test('is only for admins', async ({ page }) => {
    await page.goto('/customers');
    await page.getByRole('button', { name: 'Log out' }).click();
    await page.goto('/customers');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fcustomers/);
  });
});

test.describe('CU2 - filter customers', () => {
  test('filters on lastname only: starts-with and not case-sensitive', async ({ page }) => {
    await page.goto('/customers');
    const filter = page.getByLabel('Filter customers by last name');

    await filter.fill('ja');
    await expect(rows(page)).toHaveCount(2); // Janssens + Jacobs

    await filter.fill('PEE');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page)).toContainText('Peeters');

    await filter.fill('anna'); // a FIRST name: must not match
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page)).toContainText('No customers with a last name starting with "anna".');
  });
});

test.describe('CU3 - create customer', () => {
  test('country dropdown has Belgium, France and Germany', async ({ page }) => {
    await page.goto('/customers/new');
    await expect(page.locator('#country option')).toHaveText(['Belgium', 'France', 'Germany']);
  });

  test('shows red validation messages', async ({ page }) => {
    await page.goto('/customers/new');
    await page.getByLabel('Email, part before the @').fill('jimmy');
    await page.getByLabel('Email, domain after the @').fill('bad');
    await page.getByRole('button', { name: 'CREATE' }).click();

    for (const message of [
      'Firstname is required.',
      'Lastname is required.',
      'This is not a valid email address.',
      'Password is required.',
      'Street is required.',
      'Postalcode is required.',
      'City is required.',
    ]) {
      await expect(page.getByText(message)).toBeVisible();
    }
    await expect(page).toHaveURL('/customers/new');
  });

  test('creates the customer and redirects to the detail page', async ({ page }) => {
    await page.goto('/customers/new');
    await fillCustomer(page, { email: 'lotte@test.com', country: 'Germany' });
    await page.getByRole('button', { name: 'CREATE' }).click();

    await expect(page).toHaveURL(/\/customers\/cust-\d+$/);
    await expect(page.locator('#lastName')).toHaveValue('Lambrechts');
    await expect(page.locator('#emailUser')).toHaveValue('lotte');
    await expect(page.locator('#phoneNumber')).toHaveValue('470 99 88 77');
    await expect(page.locator('#country')).toHaveValue('Germany');
  });

  test('shows the error of the backend when the email already exists', async ({ page }) => {
    await page.goto('/customers/new');
    await fillCustomer(page, { email: 'jan@test.com' });
    await page.getByRole('button', { name: 'CREATE' }).click();
    await expect(page.getByRole('alert')).toHaveText('Email address already exists');
  });
});

test.describe('CU4 - customer detail', () => {
  test('opens when clicking the id', async ({ page }) => {
    await page.goto('/customers');
    await page.getByRole('link', { name: 'cust-2' }).click();

    await expect(page).toHaveURL('/customers/cust-2');
    await expect(page.locator('#firstName')).toHaveValue('Piet');
    await expect(page.locator('#lastName')).toHaveValue('Peeters');
    await expect(page.locator('#emailUser')).toHaveValue('piet');
    await expect(page.getByLabel('Email domain')).toHaveValue('test.com');
    await expect(page.getByLabel('Country code')).toHaveValue('32');
    await expect(page.locator('#phoneNumber')).toHaveValue('470 65 43 21');
    await expect(page.locator('#street')).toHaveValue('Main street');
    await expect(page.locator('#city')).toHaveValue('Ghent');
    await expect(page.locator('#firstName')).not.toBeEditable();
  });

  test('opens when clicking VIEW, and by typing the url', async ({ page }) => {
    await page.goto('/customers');
    await rows(page).filter({ hasText: 'Jacobs' }).getByRole('link', { name: 'VIEW' }).click();
    await expect(page).toHaveURL('/customers/cust-3');
    await expect(page.locator('#country')).toHaveValue('France');

    await page.goto('/customers/cust-1');
    await expect(page.locator('#firstName')).toHaveValue('Jan');
  });

  test('BACK goes to the overview', async ({ page }) => {
    await page.goto('/customers/cust-1');
    await page.getByRole('link', { name: 'BACK' }).click();
    await expect(page).toHaveURL('/customers');
  });
});

test.describe('CU5 - update customer', () => {
  test('EDIT in the overview opens the edit page of that customer', async ({ page }) => {
    await page.goto('/customers');
    await rows(page).filter({ hasText: 'Peeters' }).getByRole('link', { name: 'EDIT' }).click();
    await expect(page).toHaveURL('/customers/cust-2/edit');
    await expect(page.locator('#firstName')).toHaveValue('Piet');
  });

  test('EDIT on the detail page; no password; UPDATE shows the new data on the detail page', async ({
    page,
  }) => {
    await page.goto('/customers/cust-3');
    await page.getByRole('link', { name: 'EDIT' }).click();

    await expect(page.getByRole('heading', { name: 'Customer cust-3' })).toBeVisible();
    await expect(page.locator('#lastName')).toHaveValue('Jacobs');
    await expect(page.getByLabel('Country code')).toHaveValue('33');
    await expect(page.locator('#password')).toHaveCount(0);

    await page.locator('#lastName').fill('Jacobs-Smith');
    await page.locator('#country').selectOption('Germany');
    await page.getByRole('button', { name: 'UPDATE' }).click();

    await expect(page).toHaveURL('/customers/cust-3');
    await expect(page.locator('#lastName')).toHaveValue('Jacobs-Smith');
    await expect(page.locator('#country')).toHaveValue('Germany');
  });

  test('validation still applies', async ({ page }) => {
    await page.goto('/customers/cust-1/edit');
    await expect(page.locator('#lastName')).toHaveValue('Janssens');
    await page.locator('#lastName').fill('');
    await page.getByRole('button', { name: 'UPDATE' }).click();
    await expect(page.getByText('Lastname is required.')).toBeVisible();
    await expect(page).toHaveURL('/customers/cust-1/edit');
  });

  test('CANCEL goes back to the detail page', async ({ page }) => {
    await page.goto('/customers/cust-1/edit');
    await page.getByRole('button', { name: 'CANCEL' }).click();
    await expect(page).toHaveURL('/customers/cust-1');
  });
});
