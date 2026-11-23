import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { CreateCustomerRequest, Customer, UpdateCustomerRequest } from '../models/customer';

@Service()
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/customers`;

  getAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.url);
  }

  create(customer: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(this.url, customer);
  }

  getById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.url}/${id}`);
  }

  update(id: string, customer: UpdateCustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${this.url}/${id}`, customer);
  }
}
