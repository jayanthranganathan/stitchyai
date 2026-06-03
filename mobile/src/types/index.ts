export type Role = 'customer' | 'tailor' | 'delivery' | 'admin';

export type User = {
  id: string;
  phone: string;
  email: string | null;
  full_name: string | null;
  roles: Role[];
};

export type TokenPair = {
  access: string;
  refresh: string;
};
