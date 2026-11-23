import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Order } from '../models/order';
import { AuthService } from '../services/auth.service';
import { BasketService } from '../services/basket.service';
import { OrderService } from '../services/order.service';
import { errorMessage } from '../shared/error-message';

@Component({
  selector: 'app-basket',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './basket.html',
  styleUrl: './basket.css',
})
export class Basket {
  protected readonly basket = inject(BasketService);
  protected readonly auth = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  private readonly successDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('successDialog');

  protected readonly placing = signal(false);
  protected readonly error = signal('');
  protected readonly placedOrder = signal<Order | null>(null);

  protected changeAmount(itemId: string, value: string): void {
    this.basket.setAmount(itemId, Number(value));
  }

  placeOrder(): void {
    if (!this.auth.isCustomer()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/basket' } });
      return;
    }
    this.placing.set(true);
    this.error.set('');

    const itemGroups = this.basket
      .items()
      .map((line) => ({ itemId: line.itemId, amount: line.amount }));

    this.orderService.placeOrder({ itemGroups }).subscribe({
      next: (order) => {
        this.placedOrder.set(order);
        this.basket.clear();
        this.placing.set(false);
        this.successDialog().nativeElement.showModal();
      },
      error: (err) => {
        this.error.set(`Your order could not be placed: ${errorMessage(err)}`);
        this.placing.set(false);
      },
    });
  }

  protected dialogClosed(): void {
    this.router.navigate(['/items']);
  }
}
