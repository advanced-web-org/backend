import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { MakeTransactionBody } from './partner.controller';
import { EncryptMethod } from 'src/auth/guards/rsa.guard';

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
          [EncryptMethod.pgp]: fs.readFileSync('pgp-keys/public.asc', 'utf-8')
        },
        'Bank B': {
          [EncryptMethod.rsa]: fs.readFileSync('rsa-keys/public1.pem', 'utf-8'),
          [EncryptMethod.pgp]: fs.readFileSync('pgp-keys/public1.asc', 'utf-8')
        }
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
    encryptMethod: EncryptMethod,
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

  getPublicKey(bankCode: string, encryptMethod: EncryptMethod): string {
    return this.publicKeys[bankCode][encryptMethod];
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
    data: 'eiZBQzRyClJLurHhyAEH8K9I7ZGOYfe9onzpgs+9cUbRtJ6IvmnlcyeuMBdV7/+ivm6P8MPbZjv11Pf64KQrKflRuJYfh61z1xboLLMJKbc58/SHFYEUYIk+rHH1SxxOldjPcIlSBNB6VwH3sqRcydZ/YcCu1mzSoHN0NItutBWCk1UJh+UO1UUNMOkt1UT9WUFYfk1x1qz0HACDezoWKmGBI1z/sdLo6mY8cd3Dc3urhAv0dhy1ux83GOr497dc9fnyIWGogXXMCd+fbF+VB/asF7qhs86Df81KepibsymfaxryheS1TK75PS1ewk4Vi1D4U7AcnwRZ71H9NkngNkp/e+0cnSlBr0ggUaogP8D06cvpvXWHRQIsxtGH01DHph8CriYSru5YoJaehRD8UTUzh1GLSxCM/4oA/5/CbbzEAnXRIO3yqniSdMyUb7tJnaSbuWLUPeIv6yRnQ0hHQxKsFK0jRqKPfb4X8q1t3zixDT/1ux87UpfzMQZ9y82JFyWNJSiz3RYOIyu+Lk85/CbeWipDkAgx49WFEdWqAzhKwkjkfsrTphNcWfQL3VnNUCvBPY2mcHYSQE9UGbcipVlUA0UHHz7VcRPre2OTqjsuzoeB1AKUXhCnNdMT4c9BQ8EvSb7GScq4jKi8daKuUlVLsaoS6E2aluJ1Kn7HdDw=',
    integrity:
      '01f00173a010f6f791c575730198e6dae3714365cf86453a5b22d673b7059f19',
    signature:
      '06416e551ebd91d52d146e6aff44a7024daf7aa9e6446d5158bc6de5d2b5934ceb88005dc8fe2c831e8d7ad282071e553515e3edb7475f89ad4c3f1d93853cf299050ea9d26c2b7ba733a1a8762555da3d5474019636152c646a72f18ec24870a2e265269a3069f25c3478d9951fcf17267555eaee8b9f0bf2df59a964f5856cd7d2e68444a4e2069450312b8ead5be5066e7f5527451a75c03b2cd64ad1dd0dfdca0907462b1c7785da38903315a5c72dc044c3ae6c4abbebd4e0b6aba656a07d7a3d0f4d02e22b64041a7edfef936b43cabc872fb776e3714c073e62acd04139e1360224f63ad88792717b5d1bdad4a734b058455043774e549fca3eac7526c4b74d89eba4672e7ce77ed105507e04ed6ce173d57d32c1246af36918b89127d781f9d3d206961b731c1331fd6a5bf5ca36cf3b80f27f7fe145dd55ac44a0d3e9c13acd3f578bc5fdc0725c303443d3c18b134d611bcda3b80a934f26bd4dfbf6960174195fc4b6ec82bab7faa4be3084ed9098d46c30a30f02e4aa2814803636b69857495278dd0bc829aa4263e248fc8a35a3370a6762a0b832d986f9fe3d27399a1c065a1fce3c3443865b6980982129a110d2a943dcd984b5e580802be4944fa2ac6680189d417197495ca29b1b26ab9a98fd9c7f684ee7f0db3a130228e673da8b79c785980d23d61448a153dfed12b2e52d133bdadd8a49d882a5ec5b',
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

  // Verify timestamp
  const isFresh = rsaService.isRequestFresh(
    new Date(parsedData.timestamp).getTime(),
  );
  console.log('Timestamp Freshness:', isFresh);
}

// verifyResponse();
// generateSampleRequestFromOpponent();
