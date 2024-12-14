import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy (Strategy) {
  private readonly logger: Logger = new Logger(LocalStrategy.name);
  constructor(
    private readonly authService: AuthService
  ) {
    super()
  }

  async validate(username: string, password: string) {
    return await this.authService.validateCustomer({ username, password });
  }
  
}