export interface TokenPayload {
  username: string;
}

export enum Role {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  EMPLOYEE = 'employee'
};

export type IUser = {
  userId: string;
  username: string;
  email?: string;
  fullName?: string;
  role: Role;
};