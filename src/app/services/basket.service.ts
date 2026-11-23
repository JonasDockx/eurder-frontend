import { computed, effect, Service, signal } from '@angular/core';
import { BasketLine } from '../models/basket-line';
import { Item } from '../models/item';

const STORAGE_KEY = 'eurder-basket';

@Service()
export class BasketService {
  private readonly lines = signal<BasketLine[]>(this.load());

  readonly items = this.lines.asReadonly();
  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.amount, 0));

  readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.amount * line.unitPrice, 0),
  );

  constructor() {
    effect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lines())));
  }

  add(item: Item): void {
    this.lines.update((lines) => {
      const existing = lines.find((line) => line.itemId === item.id);
      if (existing) {
        return lines.map((line) =>
          line.itemId === item.id ? { ...line, amount: line.amount + 1 } : line,
        );
      }
      return [...lines, { itemId: item.id, name: item.name, unitPrice: item.price, amount: 1 }];
    });
  }

  setAmount(itemId: string, amount: number): void {
    const safeAmount = Math.max(1, Math.floor(amount) || 1);
    this.lines.update((lines) =>
      lines.map((line) => (line.itemId === itemId ? { ...line, amount: safeAmount } : line)),
    );
  }

  remove(itemId: string): void {
    this.lines.update((lines) => lines.filter((line) => line.itemId !== itemId));
  }

  clear(): void {
    this.lines.set([]);
  }

  private load(): BasketLine[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }
}
