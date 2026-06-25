export type Role = 'customer' | 'tailor' | 'delivery' | 'admin';

export type Address = {
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  landmark?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type User = {
  id: string;
  phone: string;
  email: string | null;
  full_name: string | null;
  roles: Role[];
  addresses?: Address[];
};

export type ProfileUpdate = {
  full_name?: string;
  email?: string;
  addresses?: Address[];
};

export type TokenPair = {
  access: string;
  refresh: string;
};
