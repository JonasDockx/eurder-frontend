import { Component, inject, signal } from '@angular/core';
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
export class ItemForm {
  private readonly itemService = inject(ItemService);
  private readonly router = inject(Router);

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

    this.itemService.create(this.form.getRawValue()).subscribe({
      next: (created) => this.router.navigate(['/items', created.id]),
      error: (err) => {
        this.serverError.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/items']);
  }
}
