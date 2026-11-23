export type UrgencyLevel = 'STOCK_LOW' | 'STOCK_MEDIUM' | 'STOCK_HIGH';

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  amount: number;
  urgencyLevel: UrgencyLevel;
}

export interface ItemRequest {
  name: string;
  description: string;
  price: number;
  amount: number;
}
