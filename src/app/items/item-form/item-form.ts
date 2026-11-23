import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ItemService } from '../../services/item.service';
import { Router } from '@angular/router';
import { errorMessage } from '../../shared/error-message';
import { toSignal } from '@angular/core/rxjs-interop';
import { CharCounter } from '../../shared/char-counter/char-counter';

export const DESCRIPTION_MAX = 255;

@Component({
  imports: [ReactiveFormsModule, CharCounter],
  selector: 'app-item-form',
  styleUrl: './item-form.css',
  templateUrl: './item-form.html',
})
export class ItemForm implements OnInit {
  private readonly itemService = inject(ItemService);
  private readonly router = inject(Router);

  readonly id = input<string>();
  protected readonly isEdit = computed(() => !!this.id());

  protected readonly descriptionMax = DESCRIPTION_MAX;
  protected readonly saving = signal(false);
  protected readonly serverError = signal('');

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.maxLength(DESCRIPTION_MAX)]],
    price: [0, [Validators.required, Validators.min(0)]],
    amount: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });

  protected readonly description = toSignal(this.form.controls.description.valueChanges, {
    initialValue: '',
  });

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.itemService.getById(id).subscribe({
        next: ({ name, description, price, amount }) =>
          this.form.setValue({ name, description, price, amount }),
        error: (err) => this.serverError.set(errorMessage(err)),
      });
    }
  }

  protected showError(field: keyof typeof this.form.controls, error: string): boolean {
    const control = this.form.controls[field];
    return control.hasError(error) && (control.touched || control.dirty);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    const item = this.form.getRawValue();
    const id = this.id();
    const request = id ? this.itemService.update(id, item) : this.itemService.create(item);

    request.subscribe({
      next: (saved) => this.router.navigate(['/items', saved.id]),
      error: (err) => {
        this.serverError.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    const id = this.id();
    this.router.navigate(id ? ['/items', id] : ['/items']);
  }
}
