import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { TransactionBodyDto } from './dto/inbound-transaction.dto';

export enum EncryptMethod {
  rsa = 'rsa',
  pgp = 'pgp',
}
@Injectable()
export class RsaService {
  private privateKey: string;
  private publicKeys: Record<string, Record<EncryptMethod, string>>;
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
        'Bank A': {
          [EncryptMethod.rsa]: fs.readFileSync('rsa-keys/public.pem', 'utf-8'),
          [EncryptMethod.pgp]: fs.readFileSync('pgp-keys/public.asc', 'utf-8'),
        },
        'Bank B': {
          [EncryptMethod.rsa]: fs.readFileSync('rsa-keys/public1.pem', 'utf-8'),
          [EncryptMethod.pgp]: fs.readFileSync('pgp-keys/public1.asc', 'utf-8'),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to load public keys. Ensure key files exist and are readable.',
      );
    }

    this.secretKey = process.env.SECRET_KEY || 'TECHBANK_NOMEOBANK';
  }

  isBankRegistered(bankCode: string): boolean {
    if (!bankCode) {
      throw new BadRequestException('Bank code is required');
    }
    return !!this.publicKeys[bankCode];
  }

  isRequestFresh(
    requestTimestamp: number,
    thresholdInMillis: number = 30000, // 30 seconds
  ): boolean {
    if (!requestTimestamp || isNaN(requestTimestamp)) {
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
      return sign.sign(this.privateKey, 'base64');
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
    encryptMethod: EncryptMethod = EncryptMethod.rsa,
  ): boolean {
    if (!data || !signature || !bankCode) {
      throw new BadRequestException(
        'Data, signature, and bank code are required for verification',
      );
    }

    const publicKey = this.publicKeys[bankCode][encryptMethod];
    if (!publicKey) {
      throw new BadRequestException(
        `Bank with code ${bankCode} is not registered with ${encryptMethod} encryption`,
      );
    }

    try {
      const verify = crypto.createVerify(hashMethod);
      verify.update(data);
      verify.end();
      return verify.verify(publicKey, signature, 'base64');
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

    const publicKey = this.publicKeys[bankCode][EncryptMethod.rsa];
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


  publicDecrypt(encryptedData: string, publicKey: string): string {
    if (!encryptedData) {
      throw new BadRequestException('Encrypted data is required');
    }

    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      const decrypted = crypto.publicDecrypt(publicKey, buffer);
      return decrypted.toString();
    } catch (error) {
      throw new InternalServerErrorException(
        `Decryption failed: ${error.message}`,
      );
    }
  }

  privateEncrypt(data: string): string {
    if (!data) {
      throw new BadRequestException('Data to encrypt is required');
    }

    try {
      const buffer = Buffer.from(data);
      const encrypted = crypto.privateEncrypt(this.privateKey, buffer);
      return encrypted.toString('base64');
    } catch (error) {
      throw new InternalServerErrorException(
        `Encryption failed: ${error.message}`,
      );
    }
  }

  privateDecrypt(encryptedData: string): string {
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

  getPublicKey(bankCode: string, encryptMethod: EncryptMethod = EncryptMethod.rsa): string {
    return this.publicKeys[bankCode][encryptMethod];
  }
}

async function runTests() {
  const rsaService = new RsaService();

  // Mock transaction data
  const transaction: TransactionBodyDto = {
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
    EncryptMethod.rsa,
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

async function generateSampleTransactionReq() {
  const rsaService = new RsaService();

  // Mock opponent request data
  const opponentRequestData = {
    fromBankCode: 'Bank B',
    fromAccountNumber: '123456789',
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

async function generateSampleGetInfoReq() {
  const rsaService = new RsaService();

  // Mock opponent request data
  const opponentRequestData = {
    fromBankCode: 'Bank B',
    accountNumber: 'A12345',
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
    data:
      'EIApwOSJwWRN3vqiacjL4G5HnfG75c0qRaLLJ3U9F4WKCgMmiVDT7i9pNMhCLtVt0x7M/rg9JrY+9HP/renS6bEDYV+m2IMRrwCvHG49HLcm/dwuEnOlxQvpaO6vg8Bf3MumyxDWYRJehDJMubgzcyK1haQz4/oDq1lqF0R84KJf3jue50652TBMbqTQxjO9l/fM5ap4kVS11ALfA5SpBSI53D12I/mX4DnR4ThPAZjRnWn14Rz+Kl05zKmVeAz534sM4/dx5We7QTmvSQkqqG+MR3sQOPLhLxkLrov70TX5YG7LyzsmNpyfiBRazJCxCTzYiFzgVVMIManocj41b1ZCfQcvWMQxpQptCvRNnYyP1b/P+mWSoUBHWBuaszqUetkhgHmmSCiwwGyxx9b+y8zJzqNHhYPF0EdQ6SCoPnCGuo3ykHKlEVC4KwRG3nti6jV4E0AeBXwzM+clF58xfHOF3b6IOpxxnUJCw9AuDAxSFB80yIwsURv2I0L6l3mMfMggEBOXFLqgxP3YxebQIFoxqgWmKzup300ICPuR+sOOd/i0pFIc0DQPMWvQoZR7g0xPRjdrGT9IazM8J5Q9DyKnmjN7ekbmlfivSqqbV05zjyPfqvm/Pshp4hwswBxahnFR3xfT5ZpfdJEe2m3R903hUh4HxLysc5tLeESm3UE=',
    integrity:
      'b149a7b2ee354565845235af80cdea6e72c3bb1b501345e4289bc4d5d089c144',
    signature:
      '5011b4a95aa613dcaf5554b9f52431992605333531939a3ddd2beb7da86655f66180dde328195adf9800ba171b71eaff14fe15582ed24cfbf5bebd53eb301ff5294bb86b73b33c987295fdbca3a76c6c3dfd59e05974f7d0ced647a2119aee521fec789d6a4f484d1331651f78a6009addcf96281673378900b916b423ee3e1e0f7e7a77b71e98743425a037829c7bf418b4ae19a9a640c78fe55bc383fbb64aae87c50005cac25d83736fd06d5d46a5a2094e10dde04579c5e74335342f96cc10f379b00db0f0fe30f4f5d9e50b7b20a454c77be98d0bb720adb4e2c873377b15514f958bee4a7d56dac35e0385052d562f40809c12cbd8792534252b5aa80fca53c54afb572cd8f869e283c32ed3da71181b03c49bd5034b5f1dad3146fc2e9baae59abe4e79f0498176e0b3fa85cbc97c5e5227ea83d02548409049377308504aae01541a7e965948b56f096c3d1f7f2548045cf1c83511482c0e562d0f93f26dc3192e48aa753fd36d35c491bac508325365f661a0c45186f23429186b51bd97946d159513ab2fd095ed8e02f5259d77e2306d6ff9b6d8e0fb3832fcea9eaa00e777618557f0315fdf7b87403f4ec187510131d2d5911a89e9911e00414cae76ae43297e502549c8f875f4500ddc06d8ec1a3dea1b0a17c235eba2385d83affdae9e314f5db948fb33a5c31b488cd59dba7d23e76ce2135313fd7cdde721',
  };

  const rsaService = new RsaService();

  // Decrypt data with company's private key
  const privateKey = fs.readFileSync('rsa-keys/private1.pem', 'utf-8');
  const decryptedData = crypto
    .privateDecrypt(privateKey, Buffer.from(response.data, 'base64'))
    .toString();

  // Verify integrity
  const isIntegrityValid = rsaService.isHashValid(
    decryptedData,
    response.integrity,
  );
  console.log('Integrity Valid:', isIntegrityValid);

  // Verify signature with opponent's public key
  const verify = crypto.createVerify('sha256');
  verify.update(decryptedData);
  verify.end();
  const isSignatureValid = verify.verify(
    rsaService.getPublicKey('Bank A', EncryptMethod.rsa),
    response.signature,
    'hex',
  );
  console.log('Signature Valid:', isSignatureValid);

  // Parse decrypted data
  const parsedData = JSON.parse(decryptedData);
  console.log('Parsed Data:', parsedData);
}

verifyResponse();
// generateSampleTransactionReq();
// generateSampleGetInfoReq();
