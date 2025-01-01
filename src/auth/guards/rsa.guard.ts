import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RsaService } from 'src/partner/rsa.service';

@Injectable()
export class RsaGuard implements CanActivate {
  constructor(private readonly rsaService: RsaService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { header, payload, integrity, signature } = request.body;
    const hashMethod = header.hashMethod;
    const decryptedPayload = this.rsaService.decrypt(payload);
    const payloadJson = JSON.parse(decryptedPayload);
    const { fromBankId } = payloadJson;

    // check if the bank is registered
    if (!this.rsaService.isBankRegistered(fromBankId)) {
      throw new ForbiddenException('Bank is not registered');
    }

    // check if the request is fresh
    if (!this.rsaService.isRequestFresh(payload.timestamp)) {
      throw new ForbiddenException('Request is outdated');
    }

    // check if the hahs is valid
    const dataToHash = JSON.stringify({
      header,
      payloadJson,
    });
    if (!this.rsaService.isHashValid(dataToHash, integrity, hashMethod)) {
      throw new ForbiddenException('Hash is invalid');
    }

    // check if the signature is valid
    if (signature) {
      if (
        !this.rsaService.verifySignature(
          dataToHash,
          signature,
          fromBankId,
          hashMethod,
        )
      ) {
        throw new ForbiddenException('Signature is invalid');
      }
    }

    return true;
  }
}
