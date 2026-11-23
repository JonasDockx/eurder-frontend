import { Component, inject } from '@angular/core';
import { BasketService } from '../services/basket.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-basket',
  imports: [CurrencyPipe],
  templateUrl: './basket.html',
  styleUrl: './basket.css',
})
export class Basket {
  protected readonly basket = inject(BasketService);

  protected changeAmount(itemId: string, value: string): void {
    this.basket.setAmount(itemId, Number(value));
  }
}
