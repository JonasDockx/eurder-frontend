import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/item';
import { StockBadge } from '../../shared/stock-badge/stock-badge';
import { CurrencyPipe } from '@angular/common';
import { startsWithFilter } from '../../shared/starts-with';
import { RouterLink } from '@angular/router';

@Component({
  imports: [StockBadge, CurrencyPipe, RouterLink],
  selector: 'app-item-list',
  styleUrl: './item-list.css',
  templateUrl: './item-list.html',
})
export class ItemList implements OnInit {
  private readonly itemService = inject(ItemService);

  protected readonly items = signal<Item[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly search = signal('');
  protected readonly filteredItems = computed(() =>
    startsWithFilter(this.items(), this.search(), (item) => item.name),
  );

  ngOnInit(): void {
    this.itemService.getAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the items. Is the backend running?');
        this.loading.set(false);
      },
    });
  }

  protected imageUrl(item: Item): string {
    return `https://picsum.photos.seed/${item.id}/300/200`;
  }

  protected useFallbackImage(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.endsWith('item-placeholder.svg')) {
      img.src = 'item-placeholder.svg';
    }
  }
}
