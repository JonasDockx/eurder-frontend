import { Component, inject, input, OnInit, signal } from '@angular/core';
import { ItemService } from '../../services/item.service';
import { errorMessage } from '../../shared/error-message';
import { Item } from '../../models/item';
import { StockBadge } from '../../shared/stock-badge/stock-badge';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { BasketService } from '../../services/basket.service';
import { ToastService } from '../../services/toast.service';

@Component({
  imports: [StockBadge, RouterLink, DecimalPipe],
  selector: 'app-item-detail',
  styleUrl: './item-detail.css',
  templateUrl: './item-detail.html',
})
export class ItemDetail implements OnInit {
  private readonly itemService = inject(ItemService);
  protected readonly auth = inject(AuthService);

  protected readonly basket = inject(BasketService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  protected readonly item = signal<Item | null>(null);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.itemService.getById(this.id()).subscribe({
      next: (item) => this.item.set(item),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  addToBasket(item: Item): void {
    this.basket.add(item);
    this.toast.show(`${item.name} added to basket`);
  }
}
