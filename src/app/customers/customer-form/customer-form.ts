import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { errorMessage } from '../../shared/error-message';
import { CreateCustomerRequest, Customer } from '../../models/customer';
import { splitEmail, splitPhone } from '../customer-format';

export const COUNTRIES = ['Belgium', 'France', 'Germany'];

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-customer-form',
  styleUrl: './customer-form.css',
  templateUrl: './customer-form.html',
})
export class CustomerForm implements OnInit {
  private readonly customerService = inject(CustomerService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());

  protected readonly countries = COUNTRIES;
  protected readonly saving = signal(false);
  protected readonly serverError = signal('');

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: this.fb.group({
      user: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._%+-]+$/)]],
      domain: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/)]],
    }),
    password: ['', [Validators.required, Validators.minLength(4)]],
    phone: this.fb.group({
      countryCode: ['32', [Validators.required, Validators.pattern(/^\d{1,3}$/)]],
      number: ['', Validators.required, Validators.pattern(/^[0-9 ]{6,15}$/)],
    }),
    address: this.fb.group({
      street: ['', Validators.required],
      houseNumber: ['', Validators.required],
      postalCode: ['', Validators.required, Validators.pattern(/^\d{4,5}$/)],
      city: ['', Validators.required],
      country: [COUNTRIES[0], Validators.required],
    }),
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.form.controls.password.disable();
      this.customerService.getById(id).subscribe({
        next: (customer) => this.fillForm(customer),
        error: (err) => this.serverError.set(errorMessage(err)),
      })
    }
  }

  private fillForm(customer: Customer): void {
    this.form.patchValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: splitEmail(customer.email),
      phone: splitPhone(customer.phoneNumber),
      address: {...customer.address, country: customer.address.country ?? COUNTRIES[0] },
    })
  }

  protected showError(path: string, error: string): boolean {
    const control = this.form.get(path);
    return !!control && control.hasError(error) && (control.touched || control.dirty);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    const id = this.id();
    if (id) {
      const { password, ...customer} = this.toRequest();
      this.customerService.update(id, customer).subscribe({
        next: () => this.router.navigate(['/customers', id]),
        error: (err) => this.fail(err),
      });
      return;
    }

    const customer = this.toRequest();
    this.customerService.create(customer).subscribe({
      next: (created) => {
        if (this.auth.isAdmin()) {
          this.router.navigate(['/customers', created.id]);
        } else {
          this.auth
            .login(customer.email, customer.password)
            .subscribe(() => this.router.navigate(['/items']));
        }
      },
      error: (err) => {
        this.fail(err);
      },
    });
  }

  cancel(): void {
    const id = this.id();
    if (id) {
      this.router.navigate(['/customers', id]);
    } else {
      this.router.navigate([this.auth.isAdmin() ? '/customers' : '/items']);
    }
  }

  private fail(err: unknown): void {
    this.serverError.set(errorMessage(err));
    this.saving.set(false);
  }

  private toRequest(): CreateCustomerRequest {
    const { firstName, lastName, email, password, phone, address } = this.form.getRawValue();
    return {
      firstName,
      lastName,
      email: `${email.user}@${email.domain}`,
      password,
      phoneNumber: `+${phone.countryCode} ${phone.number}`,
      address,
    };
  }
}
