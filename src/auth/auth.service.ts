import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  me() {
    return {
      fullname: 'John Doe',
      email: 'quancodon@gmail.com',
      phone: '0123456789',
      role: 'user',
      access_token: 'abc123xyz',
    };
    throw new Error('Method not implemented.');
  }

  signin(body: any) {
    return {
      fullname: 'John Doe',
      email: 'quancodon@gmail.com',
      phone: '0123456789',
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
