import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  me(body: any) {
    return {
      id: 1,
      fullname: 'John Doe',
      email: 'quancodon@gmail.com',
      phone: '0123456789',
      account_number: 'A12345',
      bank_id: 1,
      account_balance: 1000000,
      role: 'employee',
      access_token: 'abc123xyz',
    };
    return {
      fullname: 'John Doe',
      email: 'quancodon@gmail.com',
      phone: '0123456789',
      account_number: 'A12345',
      account_balance: 1000000,
      role: 'user',
      access_token: 'abc123xyz',
    };
    throw new Error('Method not implemented.');
  }

  signin(body: any) {
    if (body.phone === 'staff') {
      return {
        fullname: 'John Doe',
        email: 'quancodon@gmail.com',
        phone: '0123456789',
        account_number: 'A12345',
        account_balance: 1000000,
        role: 'employee',
        access_token: 'abc123xyz',
      };
    }
    return {
      fullname: 'John Doe',
      email: 'quancodon@gmail.com',
      phone: '0123456789',
      account_number: '123456789',
      account_balance: 1000000,
      role: 'user',
      access_token: 'abc123xyz',
    };
  }

  signup(body: any) {
    return {
      accessToken: 'abc123xyz',
    };
    throw new Error('Method not implemented.');
  }
}
