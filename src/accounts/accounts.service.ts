import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from 'src/prisma.service';
import { RsaService } from 'src/partner/rsa.service';
import { HttpService } from '@nestjs/axios';
import { ExternalAccountResponseDto } from './accounts.controller';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly rsaService: RsaService,
    private readonly httpService: HttpService,
  ) { }

  create(createAccountDto: CreateAccountDto) {
    return this.prismaService.account.create({
      data: createAccountDto,
    });
  }

  findAll() {
    return this.prismaService.account.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} account`;
  }

  findOnebyAccountNumber(accountNumber: string) {
    return this.prismaService.account.findFirst({
      where: {
        account_number: accountNumber,
      },
    });
  }

  findOneByCustomerId(customerId: number) {
    return this.prismaService.account.findFirst({
      where: {
        customer_id: customerId,
      },
    });
  }

  update(id: number, updateAccountDto: UpdateAccountDto) {
    return `This action updates a #${id} account`;
  }

  remove(id: number) {
    return `This action removes a #${id} account`;
  }

  async getExternalAccountInfo(accountNumber: string, bankCode: string): Promise<ExternalAccountResponseDto> {
    const timestamp = Date.now();
    const payload = {
      bank_code: "B001",
      account_number: accountNumber,
      timestamp,
    };
  
    // Encrypt the payload and hash
    const encryptedPayload = this.rsaService.encrypt(JSON.stringify(payload), bankCode);
    const hashedPayload = this.rsaService.hashData(encryptedPayload, 'sha256');
  
    const requestPayload = {
      encryptedPayload,
      hashedPayload,
    };
  
    try {
      const response = await this.httpService
        .post('https://nomeobank.onrender.com/transactions/recipient_profile', requestPayload)
        .toPromise();
  
      console.log('Response received:', response?.data);
  
      if (!response?.data?.data?.encryptedPayload) {
        throw new Error('Invalid response structure or missing encryptedPayload');
      }
  
      // Decrypt the payload
      const decryptedPayload = this.rsaService.privateDecrypt(response.data.data.encryptedPayload);
  
      console.log('Decrypted payload:', decryptedPayload);
  
      // Parse the decrypted string into JSON
      const parsedPayload: ExternalAccountResponseDto = JSON.parse(decryptedPayload);
  
      return parsedPayload;
    } catch (error) {
      console.error('Failed to fetch recipient profile:', error.message);
  
      // Handle error details from the external API response
      if (error.response && error.response.data) {
        console.error('External API Error Details:', error.response.data);
      }
  
      // throw a generic error
      throw new Error('Failed to fetch recipient profile. Please try again later.');
    }
  }
}
