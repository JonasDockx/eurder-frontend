export type Role = 'ADMIN' | 'CUSTOMER';

export interface User {
  email: string;
  role: Role;
  customerId: string | null;
}
