import { Routes } from '@angular/router';
import { ItemList } from './items/item-list/item-list';
import { ItemForm } from './items/item-form/item-form';
import { adminGuard } from './auth/admin-guard';
import { Login } from './auth/login/login';
import { ItemDetail } from './items/item-detail/item-detail';
import { CustomerList } from './customers/customer-list/customer-list';
import { CustomerForm } from './customers/customer-form/customer-form';
import { CustomerDetail } from './customers/customer-detail/customer-detail';
import { Basket } from './basket/basket';

export const routes: Routes = [
  { path: '', redirectTo: 'items', pathMatch: 'full' },
  { path: 'items', component: ItemList, title: 'Items' },
  { path: 'items/new', component: ItemForm, canActivate: [adminGuard], title: 'Create item' },
  { path: 'items/:id', component: ItemDetail, title: 'Item' },
  { path: 'items/:id/edit', component: ItemForm, canActivate: [adminGuard], title: 'Edit item' },
  { path: 'customers', component: CustomerList, canActivate: [adminGuard], title: 'Customers' },
  { path: 'customers/new', component: CustomerForm, title: 'Create customer' },
  {
    path: 'customers/:id',
    component: CustomerDetail,
    canActivate: [adminGuard],
    title: 'Customer',
  },
  {
    path: 'customers/:id/edit',
    component: CustomerForm,
    canActivate: [adminGuard],
    title: 'Edit customer',
  },
  { path: 'basket', component: Basket, title: 'Basket' },
  { path: 'login', component: Login, title: 'Log in' },
  { path: '**', redirectTo: 'items' },
];
