import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CustomerService } from '../../services/customer.service';
import { Customer } from '../../models/customer';
import { errorMessage } from '../../shared/error-message';
import { RouterLink } from '@angular/router';
import { startsWithFilter } from '../../shared/starts-with';

@Component({
  imports: [RouterLink],
  selector: 'app-customer-list',
  styleUrl: './customer-list.css',
  templateUrl: './customer-list.html',
})
export class CustomerList implements OnInit {
  private readonly customerService = inject(CustomerService);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly search = signal('');

  protected readonly filteredCustomers = computed(() =>
    startsWithFilter(this.customers(), this.search(), (customer) => customer.lastName),
  );

  ngOnInit(): void {
    this.customerService.getAll().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
