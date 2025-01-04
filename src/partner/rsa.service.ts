import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { MakeTransactionBody } from './partner.controller';

@Injectable()
export class RsaService {
  private privateKey: string;
  private publicKeys: Record<string, string>;
  private secretKey: string;

  constructor() {
    try {
      this.privateKey = fs.readFileSync('rsa-keys/private.pem', 'utf-8');
    } catch (error) {
      throw new InternalServerErrorException('Failed to load private key. Ensure the key file exists and is readable.');
    }

    try {
      this.publicKeys = {
        'Bank A': fs.readFileSync('rsa-keys/public.pem', 'utf-8'),
        'Bank B': fs.readFileSync('rsa-keys/public1.pem', 'utf-8'),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to load public keys. Ensure key files exist and are readable.');
    }

    this.secretKey = process.env.SECRET_KEY || 'default-secret-key'; 
  }

  isBankRegistered(bankCode: string): boolean {
    if (!bankCode) {
      throw new BadRequestException('Bank code is required');
    }
    return !!this.publicKeys[bankCode];
  }

  isRequestFresh(
    requestTimestamp: number,
    thresholdInMillis: number = 3600000,
  ): boolean {
    if (!requestTimestamp || isNaN(requestTimestamp)) {
      console.log('TIMESTAMP:', requestTimestamp);
      throw new BadRequestException('Invalid request timestamp');
    }

    const currentTime = Date.now();
    const requestTime = new Date(requestTimestamp).getTime();

    return currentTime - requestTime <= thresholdInMillis;
  }

  hashData(data: string, hashMethod: string = 'sha256'): string {
    if (!data) {
      throw new BadRequestException('Data to hash is required');
    }

    try {
      return crypto
        .createHash(hashMethod)
        .update(data + this.secretKey)
        .digest('hex');
    } catch (error) {
      throw new InternalServerErrorException(`Hashing failed: ${error.message}`);
    }
  }

  isHashValid(
    data: string,
    receivedHash: string,
    hashMethod: string = 'sha256',
  ): boolean {
    if (!receivedHash) {
      throw new BadRequestException('Received hash is required for validation');
    }

    const hash = this.hashData(data, hashMethod);
    return hash === receivedHash;
  }

  createSignature(data: string, hashMethod: string = 'sha256'): string {
    if (!data) {
      throw new BadRequestException('Data to sign is required');
    }

    try {
      const sign = crypto.createSign(hashMethod);
      sign.update(data);
      sign.end();
      return sign.sign(this.privateKey, 'hex');
    } catch (error) {
      throw new InternalServerErrorException(`Signing failed: ${error.message}`);
    }
  }

  verifySignature(
    data: string,
    signature: string,
    bankCode: string,
    hashMethod: string = 'sha256',
  ): boolean {
    if (!data || !signature || !bankCode) {
      throw new BadRequestException('Data, signature, and bank code are required for verification');
    }

    const publicKey = this.publicKeys[bankCode];
    if (!publicKey) {
      throw new BadRequestException(`Bank with code ${bankCode} is not registered`);
    }

    try {
      const verify = crypto.createVerify(hashMethod);
      verify.update(data);
      verify.end();
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      throw new InternalServerErrorException(`Verification failed: ${error.message}`);
    }
  }

  encrypt(data: string, bankCode: string): string {
    if (!data) {
      throw new BadRequestException('Data to encrypt is required');
    }

    const publicKey = this.publicKeys[bankCode];
    if (!publicKey) {
      throw new BadRequestException(`Bank with code ${bankCode} is not registered`);
    }

    try {
      const buffer = Buffer.from(data);
      const encrypted = crypto.publicEncrypt(publicKey, buffer);
      return encrypted.toString('base64');
    } catch (error) {
      throw new InternalServerErrorException(`Encryption failed: ${error.message}`);
    }
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) {
      throw new BadRequestException('Encrypted data is required');
    }

    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const decrypted = crypto.privateDecrypt(this.privateKey, buffer);
      return decrypted.toString();
    } catch (error) {
      throw new InternalServerErrorException(`Decryption failed: ${error.message}`);
    }
  }

  generateSampleRequestFromOpponent(data: any): object {
    const myBankCode = 'Bank A'; // Your bank's code
    const opponentBankCode = 'Bank B'; // Opponent bank's code
  
    // Ensure your public key and opponent's private key are available
    if (!this.publicKeys[myBankCode]) {
      throw new Error('Your bank is not registered');
    }
  
    // Step 1: Encrypt the payload using your bank's public key (`0`)
    const payload = this.encrypt(JSON.stringify(data), myBankCode);
  
    // Step 2: Create the header (with hash method and timestamp)
    const header = {
      hashMethod: 'SHA256',
      timestamp: Date.now(),
    };
  
    // Step 3: Create the integrity hash (using header + payload)
    const integrityHash = this.hashData(
      JSON.stringify(header) + payload,
      'sha256',
    );
  
    // Step 4: Create the signature using the opponent bank's private key
    const opponentPrivateKey = fs.readFileSync('rsa-keys/private1.pem', 'utf-8');
    const signature = this.createSignatureWithKey(
      JSON.stringify(header) + payload,
      opponentPrivateKey,
      'sha256',
    );
  
    // Return the full request object ready for Postman
    return {
      header,
      encryptedPayload: payload,
      integrity: integrityHash,
      signature,
    };
  }
  
  // A helper method to create a signature with a given private key
  createSignatureWithKey(data: string, privateKey: string, hashMethod: string = 'sha256'): string {
    const sign = crypto.createSign(hashMethod);
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'hex');
  }
}

async function runTests() {
  const rsaService = new RsaService();

  // Mock transaction data
  const transaction: MakeTransactionBody = {
    header: {
      hashMethod: 'sha256',
      timestamp: new Date().toISOString(),
    },
    payload: {
      fromBankCode: 'Bank B',
      fromAccountNumber: '123456789',
      toBankAccountNumber: 'A12345',
      amount: 5000,
      message: 'Payment for invoice #12345',
      feePayer: 'sender',
      feeAmount: 50,
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
  transaction.signature = rsaService.createSignature(
    serializedHeader + serializedPayload,
  );
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
  const encryptedPayload = rsaService.encrypt(serializedPayload, 'Bank A');
  console.log('Encrypted Payload:', encryptedPayload);

  const decryptedPayload = rsaService.decrypt(encryptedPayload);
  console.log('Decrypted Payload:', decryptedPayload);

  // Timestamp Validation
  const isFresh = rsaService.isRequestFresh(
    new Date(transaction.header.timestamp).getTime(),
  );
  console.log('Timestamp Freshness:', isFresh);
}

async function generateSampleRequestFromOpponent() {
  const rsaService = new RsaService();

  // Mock opponent request data
  const opponentRequestData = {
    fromBankCode: 'Bank B',
    fromBankAccountNumber: '123456789',
    toBankAccountNumber: 'A12345',
    amount: 5000,
    message: 'Payment for invoice #12345',
    feePayer: 'sender',
    feeAmount: 50,
  };
  
  const sampleRequestFromOpponent = rsaService.generateSampleRequestFromOpponent(opponentRequestData);
  
  console.log('Sample Request from Opponent:', JSON.stringify(sampleRequestFromOpponent, null, 2));
}

generateSampleRequestFromOpponent();
