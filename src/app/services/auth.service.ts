import { computed, inject, Service, signal } from '@angular/core';
import { User } from '../models/user';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

const STORAGE_KEY = 'eurder-auth';

interface StoredAuth {
  token: string; // base64
  user: User;
}

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly auth = signal<StoredAuth | null>(this.load());

  readonly user = computed(() => this.auth()?.user ?? null);
  readonly token = computed(() => this.auth()?.token ?? null);
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');
  readonly isCustomer = computed(() => this.user()?.role === 'CUSTOMER');

  login(email: string, password: string): Observable<User> {
    const token = btoa(`${email}:${password}`);
    const headers = new HttpHeaders({ Authorization: `Basic ${token}` });
    return this.http.get<User>(`${environment.apiUrl}/users/me`, { headers }).pipe(
      tap((user) => {
        const auth = { token, user };
        this.auth.set(auth);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      }),
    );
  }

  logout(): void {
    this.auth.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private load(): StoredAuth | null {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    } catch {
      return null;
    }
  }
}
