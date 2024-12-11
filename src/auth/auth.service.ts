import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  signin(body: any) {
    return {
      accessToken: 'abc123xyz',
      role: 'user',
      username: 'john_doe',
    };
  }
  signup(body: any) {
    return 'This action adds a new user';
    throw new Error('Method not implemented.');
  }
}
