import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Toasts } from './shared/toasts/toasts';
import { BasketService } from './services/basket.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toasts],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly basket = inject(BasketService);
  protected readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/items']);
  }
}
