import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EncryptMethod, RsaService } from 'src/partner/rsa.service';

@Injectable()
export class RsaGuard implements CanActivate {
  constructor(
    private readonly rsaService: RsaService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { header, encryptedPayload, integrity, signature } = request.body;

    // 1. Decrypt the payload
    let decryptedPayload: any;
    try {
      decryptedPayload = JSON.parse(this.rsaService.decrypt(encryptedPayload));
    } catch (error) {
      throw new BadRequestException('Failed to decrypt payload.');
    }

    const hashMethod = header.hashMethod;
    const { fromBankCode } = decryptedPayload;
    const encryptMethod: EncryptMethod = header.encryptMethod || EncryptMethod.rsa;

    // 2. Validate non-default encryptMethod
    if (!Object.values(EncryptMethod).includes(encryptMethod)) {
      throw new ForbiddenException(`Encryption method '${header.encryptMethod}' is not supported`);
    }

    // 3. Check if the bank is registered
    if (!this.rsaService.isBankRegistered(fromBankCode)) {
      throw new ForbiddenException('Bank is not registered');
    }

    // 4. Check if the request is fresh
    if (!this.rsaService.isRequestFresh(header.timestamp)) {
      throw new ForbiddenException('Request is outdated');
    }

    // 5. Check if the hash is valid
    const dataToHash = JSON.stringify(header) + encryptedPayload;
    if (!this.rsaService.isHashValid(dataToHash, integrity, hashMethod)) {
      throw new ForbiddenException('Hash is invalid');
    }

    // 6. Check if the signature is valid
    if (signature) {
      if (
        !this.rsaService.verifySignature(
          dataToHash,
          signature,
          fromBankCode,
          hashMethod,
          encryptMethod
        )
      ) {
        throw new ForbiddenException('Signature is invalid');
      }
    }

    // 7. Validate decrypted payload structure using dynamic DTO
    const dto = this.reflector.get<new () => any>('dto', context.getHandler());
    if (!dto) {
      throw new BadRequestException('No DTO defined for this endpoint.');
    }

    const payloadInstance = plainToInstance(dto, decryptedPayload);
    const errors = await validate(payloadInstance);
    if (errors.length > 0) {
      throw new BadRequestException('Decrypted payload validation failed.');
    }

    // Attach the validated and decrypted payload to the request object
    request.decryptedPayload = payloadInstance;

    return true;
  }
}
