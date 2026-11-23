import { Routes } from '@angular/router';
import { ItemList } from './items/item-list/item-list';
import { ItemForm } from './items/item-form/item-form';
import { adminGuard } from './auth/admin-guard';
import { Login } from './auth/login/login';

export const routes: Routes = [
  { path: '', redirectTo: 'items', pathMatch: 'full' },
  { path: 'items', component: ItemList, title: 'Items' },
  { path: 'items/new', component: ItemForm, canActivate: [adminGuard], title: 'Create item' },
  { path: 'login', component: Login, title: 'Log in' },
  { path: '**', redirectTo: 'items' },
];
