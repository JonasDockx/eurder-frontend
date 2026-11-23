import { Routes } from '@angular/router';
import { ItemList } from './items/item-list/item-list';
import { ItemForm } from './items/item-form/item-form';
import { adminGuard } from './auth/admin-guard';
import { Login } from './auth/login/login';
import { ItemDetail } from './items/item-detail/item-detail';

export const routes: Routes = [
  { path: '', redirectTo: 'items', pathMatch: 'full' },
  { path: 'items', component: ItemList, title: 'Items' },
  { path: 'items/new', component: ItemForm, canActivate: [adminGuard], title: 'Create item' },
  { path: 'items/:id', component: ItemDetail, title: 'Item' },
  { path: 'login', component: Login, title: 'Log in' },
  { path: '**', redirectTo: 'items' },
];
