import { Component, computed, input } from '@angular/core';
import { UrgencyLevel } from '../../models/item';

const LABELS: Record<UrgencyLevel, string> = {
  STOCK_HIGH: 'HIGH',
  STOCK_MEDIUM: 'MEDIUM',
  STOCK_LOW: 'LOW',
};

@Component({
  imports: [],
  selector: 'app-stock-badge',
  styleUrl: './stock-badge.css',
  templateUrl: './stock-badge.html',
})
export class StockBadge {
  readonly level = input.required<UrgencyLevel>();
  protected readonly label = computed(() => LABELS[this.level()]);
}
