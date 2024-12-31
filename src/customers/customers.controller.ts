import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/createCustomer.dto';
import { UpdateCustomerDto } from './dto';

@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll() {
    return this.prismaService.customer.findMany();
  }

  @Get('with-accounts')
  findAllWithAccounts() {
    return this.customersService.findAllWithAccounts();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.getCustomerById(+id);
  }

  @Get('by-account-number/:accountNumber')
  getCustomerByAccountNumber(@Param('accountNumber') accountNumber: string) {
    return this.customersService.getCustomerByAccountNumber(accountNumber);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(+id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(+id);
  }
}
