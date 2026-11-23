import { HttpErrorResponse } from '@angular/common/http';

export function errorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Soemthing went wrong.';
  }
  if (error.status === 0) {
    return 'Cannot reach the server. Is the backend running?';
  }
  const body = error.error;
  if (typeof body === 'string' && body.length > 0) {
    return body;
  }
  if (body && typeof body === 'object') {
    return Object.entries(body)
      .map(([field, message]) => `${field}: ${message}`)
      .join(', ');
  }
  return `Request failed (${error.status}.`;
}
