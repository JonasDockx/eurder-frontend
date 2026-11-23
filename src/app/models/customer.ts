export interface Address {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: Address;
  phoneNumber: string;
}
