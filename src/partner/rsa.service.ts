import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
      throw new InternalServerErrorException(
        'Failed to load private key. Ensure the key file exists and is readable.',
      );
    }

    try {
      this.publicKeys = {
        'Bank A': fs.readFileSync('rsa-keys/public.pem', 'utf-8'),
        'Bank B': fs.readFileSync('rsa-keys/public1.pem', 'utf-8'),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to load public keys. Ensure key files exist and are readable.',
      );
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
      throw new InternalServerErrorException(
        `Hashing failed: ${error.message}`,
      );
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
      throw new InternalServerErrorException(
        `Signing failed: ${error.message}`,
      );
    }
  }

  verifySignature(
    data: string,
    signature: string,
    bankCode: string,
    hashMethod: string = 'sha256',
  ): boolean {
    if (!data || !signature || !bankCode) {
      throw new BadRequestException(
        'Data, signature, and bank code are required for verification',
      );
    }

    const publicKey = this.publicKeys[bankCode];
    if (!publicKey) {
      throw new BadRequestException(
        `Bank with code ${bankCode} is not registered`,
      );
    }

    try {
      const verify = crypto.createVerify(hashMethod);
      verify.update(data);
      verify.end();
      return verify.verify(publicKey, signature, 'hex');
    } catch (error) {
      throw new InternalServerErrorException(
        `Verification failed: ${error.message}`,
      );
    }
  }

  encrypt(data: string, bankCode: string): string {
    if (!data) {
      throw new BadRequestException('Data to encrypt is required');
    }

    const publicKey = this.publicKeys[bankCode];
    if (!publicKey) {
      throw new BadRequestException(
        `Bank with code ${bankCode} is not registered`,
      );
    }

    try {
      const buffer = Buffer.from(data);
      const encrypted = crypto.publicEncrypt(publicKey, buffer);
      return encrypted.toString('base64');
    } catch (error) {
      throw new InternalServerErrorException(
        `Encryption failed: ${error.message}`,
      );
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
      throw new InternalServerErrorException(
        `Decryption failed: ${error.message}`,
      );
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
    const opponentPrivateKey = fs.readFileSync(
      'rsa-keys/private1.pem',
      'utf-8',
    );
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
  createSignatureWithKey(
    data: string,
    privateKey: string,
    hashMethod: string = 'sha256',
  ): string {
    const sign = crypto.createSign(hashMethod);
    sign.update(data);
    sign.end();
    return sign.sign(privateKey, 'hex');
  }

  getPublicKey(bankCode: string): string {
    return this.publicKeys[bankCode];
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

  const sampleRequestFromOpponent =
    rsaService.generateSampleRequestFromOpponent(opponentRequestData);

  console.log(
    'Sample Request from Opponent:',
    JSON.stringify(sampleRequestFromOpponent, null, 2),
  );
}

async function verifyResponse() {
  const response = {
    data: 'WQ9qmmLnYNTyZzPqiFkRpb/Uw3QXCkryFWYzh77RTasFlINhPLIADT5tT2L0NMJ2smu7E+TQ5hSXSiU7K1hQv9MhNowDDQfWYxxG8B3C34uX4kL7AIPJhAPqL31cbOF32Cqo75VGY8oUvWwX2CQ9PZNZ42ij2V6+J5AYuxh63ME7n0nEUTr6IFCNOUkTBnOZskEEgEdtu2KKZqZVWo6GKz7CoYuFOHyvO2C1mgaiy2OjKrVRzZtS6HVETRz2zMOYHqEp+vF65ftV1YnjigVhK9ci+pY3x5McDRqrA/YH9N9v0fwc/jPyaZujt43+1hgJw1vujCMEWBjPQAVpyNbw6/+IzTXzzwI0kOvW/Jb7FnhHEKl6JA4uAFglCJrolaVnzPzyNI6un8cmT9Kzj7Yc9M1K8xL4sv0+nlmzUKpZhxyUCm602ZDKEd0tkyTnA233g4Y0NdWBDO+RY8rGvANhDyAtqMP0kmOPEIvrHM6GSV9OqphCqKgb5uEUlkoH5SCJreWyCstzLTkh1WybVdIec9qlaIM3/nbdGiS3WlkLxXLlP75O6AMiwCzCNBUYV5064d7fAuRGv0akcyJ4Hu0V+WaCTW4UfPuQViQSm5PLYX+07isknDHamUGn7s59iA/J96RkL+Ee0E+el7bRBlHhsizvEJQMgBzkgem4RkMgTJc=',
    integrity:
      '37cdfe4551a15f6214d8710080c913663ea64452c3fe9be23260736bdc8919de',
    signature:
      '41c3a63314c0fe8d236246d8ea9755d69be717690a34ba68741f80d7e6ee077e6ca0e3ce8eb62eff2a02ab94b8dbc643cd9877dca93b8c9c0babbfeb98813b5eeeb1f9e692a560c953caf3c36173554af99f794e097e0b0271fae41a677d803b87f73a0862e91bc2ea7d866ae7a859a7183ebd507c23496a6ab875468878c1044c59c81e98200a83face44961d52602436d29bfe1f58a5719d275f752ec2e63e72a0b212bb5b5bc6eb5aa6baaf2ee73c06b34e881b326eaf016e4827a28d5008ef21357d419e9b7a7ed01f5a51f2345a2a912d3da08229f229f91b8cd05948a7b2976da287ce688a530e4ab3fe0895696f41fc35880bb7557cb823d13327145b74570fd5fb0988f765c718cb8ff0b1a343ce32f92d9cb488f23ce57f313e977e856caf260113ed9f6007533d2fe0cedbd5aec518911ff65cfb34b1c4e99a5ee85607995c5a2aaef7f8fe5da393a85048969d0a148e55717bdce77fc2b57d2c440cc0c03faa82bb04fb9819ea13ae57c53357130dd18aa04302861db12c88a9e86b9c1b9d5953dba88f62f09dfc3a6c48535e560adaf275be654f77ba0cbf5eacd154bb3d27b45cdb59069646e84c9d9b9c3128b9d33a92569ce2b847ac07a52687a21ad656c12d4d44c90cdc879e1105d42f6784e689ae4aca920e53f41337b4891c5c69dfe1a11b8368b6211bba49a273294f28d36064290b6e1357b922a478',
  };

  const rsaService = new RsaService();

  // Decrypt data with company's private key
  const privateKey = fs.readFileSync('rsa-keys/private1.pem', 'utf-8');
  const decryptedData = crypto.privateDecrypt(
    privateKey,
    Buffer.from(response.data, 'base64'),
  ).toString();
  

  // Verify integrity
  const isIntegrityValid = rsaService.isHashValid(
    decryptedData,
    response.integrity,
  );
  console.log('Integrity Valid:', isIntegrityValid);

  // Verify signature with opponent's public key
  const verify = crypto.createVerify('sha256')
  verify.update(decryptedData);
  verify.end();
  const isSignatureValid = verify.verify(
    rsaService.getPublicKey('Bank A'),
    response.signature,
    'hex',
  );
  console.log('Signature Valid:', isSignatureValid);

  // Parse decrypted data
  const parsedData = JSON.parse(decryptedData);
  console.log('Parsed Data:', parsedData);

  // Verify timestamp
  const isFresh = rsaService.isRequestFresh(
    new Date(parsedData.timestamp).getTime(),
  );
  console.log('Timestamp Freshness:', isFresh);
}

verifyResponse();
