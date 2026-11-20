import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Item } from '../models/item';

@Service()
export class ItemService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/items`;

  getAll(): Observable<Item[]> {
    return this.http.get<Item[]>(this.url);
  }
}
