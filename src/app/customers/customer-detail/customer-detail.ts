import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer';
import { splitEmail, splitPhone } from '../customer-format';
import { errorMessage } from '../../shared/error-message';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-customer-detail',
  styleUrl: './customer-detail.css',
  templateUrl: './customer-detail.html',
})
export class CustomerDetail implements OnInit {
  private readonly customerService = inject(CustomerService);

  readonly id = input.required<string>();

  protected readonly customer = signal<Customer | null>(null);
  protected readonly error = signal('');

  protected readonly splitEmail = splitEmail;
  protected readonly splitPhone = splitPhone;

  ngOnInit(): void {
    this.customerService.getById(this.id()).subscribe({
      next: (customer) => this.customer.set(customer),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }
}
