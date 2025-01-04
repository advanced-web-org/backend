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
    const { header, encryptedPayload, integrity, signature } = request.body;
    const payload = JSON.parse(this.rsaService.decrypt(encryptedPayload));
    const hashMethod = header.hashMethod;
    const { fromBankCode } = payload;


    console.log('PAYLOAD:', payload);

    // check if the bank is registered
    if (!this.rsaService.isBankRegistered(fromBankCode)) {
      throw new ForbiddenException('Bank is not registered');
    }

    // check if the request is fresh
    if (!this.rsaService.isRequestFresh(header.timestamp)) {
      throw new ForbiddenException('Request is outdated');
    }

    // check if the hash is valid
    const dataToHash = JSON.stringify(header) + encryptedPayload;
    if (!this.rsaService.isHashValid(dataToHash, integrity, hashMethod)) {
      throw new ForbiddenException('Hash is invalid');
    }

    // check if the signature is valid
    if (signature) {
      if (
        !this.rsaService.verifySignature(
          dataToHash,
          signature,
          fromBankCode,
          hashMethod,
        )
      ) {
        throw new ForbiddenException('Signature is invalid');
      }
    }

    return true;
  }
}
