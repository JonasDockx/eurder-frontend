import { Component, computed, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-char-counter',
  styleUrl: './char-counter.css',
  templateUrl: './char-counter.html',
})
export class CharCounter {
  readonly length = input.required<number>();
  readonly max = input.required<number>();

  protected readonly remaining = computed(() => Math.max(0, this.max() - this.length()));
  protected readonly limitReached = computed(() => this.length() >= this.max());
}
