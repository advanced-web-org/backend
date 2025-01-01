import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/prisma.service';
import { CustomersService } from './customers.service';
import { UpdateCustomerDto } from './dto';
import { CreateCustomerDto } from './dto/createCustomer.dto';

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly prismaService: PrismaService,
  ) {}

  @ApiOperation({ summary: 'Create a customer' })
  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @ApiOperation({ summary: 'Get all customers' })
  @Get()
  findAll() {
    return this.prismaService.customer.findMany();
  }

  @ApiOperation({ summary: 'Get all customers with accounts' })
  @Get('with-accounts')
  findAllWithAccounts() {
    return this.customersService.findAllWithAccounts();
  }

  @ApiOperation({ summary: 'Get a customer by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update a customer by ID' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(+id, updateCustomerDto);
  }

  @ApiOperation({ summary: 'Delete a customer by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(+id);
  }
}
