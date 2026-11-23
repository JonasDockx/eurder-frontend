import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateOrderRequest, Order } from '../models/order';

@Service()
export class OrderService {
  private readonly http = inject(HttpClient);

  placeOrder(order: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${environment.apiUrl}/orders`, order);
  }
}
