import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { MakeTransactionBody } from './partner.controller';

@Injectable()
export class RsaService {
  private privateKey: string;
  private publicKeys: Record<string, string>;
  private secretKey: string; // for hashing

  constructor() {
    this.privateKey = fs.readFileSync('../../rsa-keys/private.pem', 'utf-8');
    // hardcoding
    this.publicKeys = {
      '0': fs.readFileSync('../../rsa-keys/public.pem', 'utf-8'),
      '1': fs.readFileSync('../../rsa-keys/public1.pem', 'utf-8'),
    };

    this.secretKey = 'my-secret-key';
  }

  isBankRegistered(bankCode: string): boolean {
    return !!this.publicKeys[bankCode];
  }

  isRequestFresh(
    requestTimestamp: number,
    thresholdInMillis: number = 60000,
  ): boolean {
    const currentTime = new Date().getTime();
    const requestTime = new Date(requestTimestamp).getTime();

    return currentTime - requestTime <= thresholdInMillis;
  }

  hashData(data: string, hashMethod: string = 'sha256'): string {
    return crypto
      .createHash(hashMethod)
      .update(data + this.secretKey)
      .digest('hex');
  }

  isHashValid(
    data: string,
    receivedHash: string,
    hashMethod: string = 'sha256',
  ): boolean {
    const hash = this.hashData(data, hashMethod);

    return hash === receivedHash;
  }

  createSignature(data: string, hashMethod: string = 'sha256'): string {
    const hash = this.hashData(data, hashMethod);
    const sign = crypto.createSign(hashMethod);
    sign.update(hash);
    sign.end();

    return sign.sign(this.privateKey, 'hex');
  }

  verifySignature(
    data: string,
    signature: string,
    bankCode: string,
    hashMethod: string = 'sha256',
  ): boolean {
    const hash = this.hashData(data, hashMethod);
    const verify = crypto.createVerify(hashMethod);
    verify.update(hash);
    verify.end();

    return verify.verify(this.publicKeys[bankCode], signature, 'hex');
  }

  encrypt(data: string, bankCode: string): string {
    const publicKey = this.publicKeys[bankCode];

    if (!publicKey) {
      throw new Error('Bank not registered with the system');
    }

    const buffer = Buffer.from(data);
    const encrypted = crypto.publicEncrypt(publicKey, buffer);

    return encrypted.toString('base64');
  }

  decrypt(encryptedData: string): string {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(this.privateKey, buffer);

    return decrypted.toString();
  }
}

async function runTests() {
  const rsaService = new RsaService();

  // Mock transaction data
  const transaction: MakeTransactionBody = {
    header: {
      hashMethod: 'sha256',
    },
    payload: {
      fromBankCode: '1',
      fromAccountNumber: '123456789',
      toBankAccountNumber: '987654321',
      amount: 5000,
      message: 'Payment for invoice #12345',
      feePayer: 'sender',
      feeAmount: 50,
      timestamp: new Date().toISOString(),
    },
    integrity: '',
    signature: '',
  };

  // Serialize payload and header
  const serializedPayload = JSON.stringify(transaction.payload);
  const serializedHeader = JSON.stringify(transaction.header);

  // Generate Integrity Hash
  transaction.integrity = rsaService.hashData(
    serializedPayload + serializedHeader,
    transaction.header.hashMethod,
  );

  console.log('Integrity Hash:', transaction.integrity);

  // Create Signature
  transaction.signature = rsaService.createSignature(serializedHeader + serializedPayload);
  console.log('Signature:', transaction.signature);

  // Verify Integrity
  const isIntegrityValid = rsaService.isHashValid(
    serializedPayload + serializedHeader,
    transaction.integrity,
    transaction.header.hashMethod,
  );
  console.log('Integrity Valid:', isIntegrityValid);

  // Verify Signature
  const isSignatureValid = rsaService.verifySignature(
    transaction.integrity,
    transaction.signature!,
    transaction.payload.fromBankCode,
    transaction.header.hashMethod,
  );
  console.log('Signature Valid:', isSignatureValid);

  // Encryption and Decryption Test
  const encryptedPayload = rsaService.encrypt(serializedPayload, '1');
  console.log('Encrypted Payload:', encryptedPayload);

  const decryptedPayload = rsaService.decrypt(encryptedPayload);
  console.log('Decrypted Payload:', decryptedPayload);

  // Timestamp Validation
  const isFresh = rsaService.isRequestFresh(
    new Date(transaction.payload.timestamp).getTime(),
  );
  console.log('Timestamp Freshness:', isFresh);
}

runTests();
