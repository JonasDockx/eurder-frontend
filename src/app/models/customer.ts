export interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string | null;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: Address;
  phoneNumber: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address: Address;
  phoneNumber: string;
}
