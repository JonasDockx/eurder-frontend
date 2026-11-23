export interface CreateOrderRequest {
  itemGroups: { itemId: string; amount: number }[];
}

export interface ItemGroup {
  itemId: string;
  itemName: string;
  amount: number;
  unitPrice: number;
  shippingDate: string;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  itemGroups: ItemGroup[];
  totalPrice: number;
}
