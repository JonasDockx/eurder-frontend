import { Page, Route } from '@playwright/test';

export const API = 'http://localhost:8080';
export const ADMIN = { email: 'admin@eurder.com', password: 'admin' };
export const CUSTOMER = { email: 'jan@test.com', password: 'secret' };

interface FakeItem {
  id: string;
  name: string;
  description: string;
  price: number;
  amount: number;
}
interface FakeAddress {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string | null;
}
interface FakeCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: FakeAddress;
}

function urgency(amount: number) {
  return amount < 5 ? 'STOCK_LOW' : amount < 10 ? 'STOCK_MEDIUM' : 'STOCK_HIGH';
}

function seedItems(): FakeItem[] {
  return [
    {
      id: 'item-1',
      name: 'Fridge Coolio Z',
      description: 'Keeps things cold',
      price: 499.99,
      amount: 15,
    },
    {
      id: 'item-2',
      name: 'Freezer Brrr',
      description: 'Keeps things very cold',
      price: 349.5,
      amount: 7,
    },
    { id: 'item-3', name: 'Toaster Pro', description: 'Makes toast', price: 29.99, amount: 2 },
    { id: 'item-4', name: 'Kettle', description: 'Boils water', price: 19.99, amount: 0 },
  ];
}

function seedCustomers(): FakeCustomer[] {
  const address = (city: string, country: string | null = 'Belgium') => ({
    street: 'Main street',
    houseNumber: '1',
    postalCode: '1000',
    city,
    country,
  });
  return [
    {
      id: 'cust-1',
      firstName: 'Jan',
      lastName: 'Janssens',
      email: CUSTOMER.email,
      phoneNumber: '+32 470 12 34 56',
      address: address('Brussels'),
    },
    {
      id: 'cust-2',
      firstName: 'Piet',
      lastName: 'Peeters',
      email: 'piet@test.com',
      phoneNumber: '+32 470 65 43 21',
      address: address('Ghent'),
    },
    {
      id: 'cust-3',
      firstName: 'Anna',
      lastName: 'Jacobs',
      email: 'anna@test.com',
      phoneNumber: '+33 612 34 56 78',
      address: address('Paris', 'France'),
    },
  ];
}

export async function fakeBackend(page: Page, options: { failOrders?: boolean } = {}) {
  const db = {
    items: seedItems(),
    customers: seedCustomers(),
    users: [
      { ...ADMIN, role: 'ADMIN', customerId: null as string | null },
      { ...CUSTOMER, role: 'CUSTOMER', customerId: 'cust-1' as string | null },
    ],
    orders: [] as { itemGroups: { itemId: string; amount: number }[] }[],
    nextId: 100,
  };

  const json = (route: Route, status: number, body: unknown) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  const text = (route: Route, status: number, body: string) =>
    route.fulfill({ status, contentType: 'text/plain', body });
  const itemDto = (item: FakeItem) => ({ ...item, urgencyLevel: urgency(item.amount) });

  const currentUser = (route: Route) => {
    const header = route.request().headers()['authorization'];
    if (!header?.startsWith('Basic ')) return null;
    const [email, password] = Buffer.from(header.slice(6), 'base64').toString().split(':');
    return db.users.find((u) => u.email === email && u.password === password) ?? null;
  };

  await page.route('https://picsum.photos/**', (route) => route.abort());

  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    const user = currentUser(route);
    const body = request.postDataJSON?.() ?? null;
    let match: RegExpMatchArray | null;

    if (path === '/users/me' && method === 'GET') {
      return user
        ? json(route, 200, { email: user.email, role: user.role, customerId: user.customerId })
        : text(route, 401, 'Wrong email or password');
    }

    if (path === '/items' && method === 'GET') return json(route, 200, db.items.map(itemDto));
    if (path === '/items' && method === 'POST') {
      if (user?.role !== 'ADMIN') return text(route, 403, 'Forbidden');
      const item = { id: `item-${db.nextId++}`, ...body };
      db.items.push(item);
      return json(route, 201, item);
    }
    if ((match = path.match(/^\/items\/([^/]+)$/))) {
      const item = db.items.find((i) => i.id === match![1]);
      if (!item) return text(route, 404, `Item with id ${match[1]} could not be found`);
      if (method === 'GET') return json(route, 200, itemDto(item));
      if (method === 'PUT') {
        if (user?.role !== 'ADMIN') return text(route, 403, 'Forbidden');
        Object.assign(item, body);
        return json(route, 200, item);
      }
    }

    // ---- customers ----
    if (path === '/customers' && method === 'POST') {
      if (db.customers.some((c) => c.email === body.email))
        return text(route, 409, 'Email address already exists');
      const { password, ...data } = body;
      const customer = { id: `cust-${db.nextId++}`, ...data };
      db.customers.push(customer);
      db.users.push({ email: body.email, password, role: 'CUSTOMER', customerId: customer.id });
      return json(route, 201, customer);
    }
    if (path.startsWith('/customers') && user?.role !== 'ADMIN') {
      return text(route, user ? 403 : 401, 'Not allowed');
    }
    if (path === '/customers' && method === 'GET') return json(route, 200, db.customers);
    if ((match = path.match(/^\/customers\/([^/]+)$/))) {
      const customer = db.customers.find((c) => c.id === match![1]);
      if (!customer) return text(route, 404, `Customer with id ${match[1]} could not be found`);
      if (method === 'GET') return json(route, 200, customer);
      if (method === 'PUT') {
        Object.assign(customer, body);
        return json(route, 200, customer);
      }
    }

    // ---- orders ----
    if (path === '/orders' && method === 'POST') {
      if (user?.role !== 'CUSTOMER') return text(route, 403, 'You are not allowed to order');
      if (options.failOrders) return text(route, 404, 'Item with id item-1 could not be found');
      db.orders.push(body);
      const itemGroups = body.itemGroups.map((group: { itemId: string; amount: number }) => {
        const item = db.items.find((i) => i.id === group.itemId)!;
        return {
          itemId: item.id,
          itemName: item.name,
          amount: group.amount,
          unitPrice: item.price,
          shippingDate: '2026-11-24',
          totalPrice: item.price * group.amount,
        };
      });
      const totalPrice = itemGroups.reduce(
        (sum: number, group: { totalPrice: number }) => sum + group.totalPrice,
        0,
      );
      return json(route, 201, {
        id: `order-${db.nextId++}`,
        customerId: user.customerId,
        itemGroups,
        totalPrice,
      });
    }

    return text(route, 404, `The fake backend has no route for ${method} ${path}`);
  });

  return db;
}

export async function loginAs(page: Page, who: 'admin' | 'customer') {
  const isAdmin = who === 'admin';
  const credentials = isAdmin ? ADMIN : CUSTOMER;
  const auth = {
    token: Buffer.from(`${credentials.email}:${credentials.password}`).toString('base64'),
    user: {
      email: credentials.email,
      role: isAdmin ? 'ADMIN' : 'CUSTOMER',
      customerId: isAdmin ? null : 'cust-1',
    },
  };
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem('e2e-seeded')) {
      localStorage.setItem('eurder-auth', value);
      sessionStorage.setItem('e2e-seeded', 'yes');
    }
  }, JSON.stringify(auth));
}

export async function withBasket(
  page: Page,
  lines: { itemId: string; name: string; unitPrice: number; amount: number }[],
) {
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem('e2e-basket-seeded')) {
      localStorage.setItem('eurder-basket', value);
      sessionStorage.setItem('e2e-basket-seeded', 'yes');
    }
  }, JSON.stringify(lines));
}
