import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const goesToBackend = req.url.startsWith(environment.apiUrl);
  if (token && goesToBackend && !req.headers.has('Authorization')) {
    req = req.clone({ setHeaders: { Authorization: `Basic ${token}` } });
  }
  return next(req);
};
