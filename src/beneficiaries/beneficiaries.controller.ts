import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('beneficiaries')
@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @ApiOperation({ summary: 'Create a beneficiary' })
  @Post()
  create(@Body() createBeneficiaryDto: CreateBeneficiaryDto) {
    return this.beneficiariesService.create(createBeneficiaryDto);
  }

  @ApiOperation({ summary: 'Get all beneficiaries' })
  @Get()
  findAll() {
    const customerID = 1; // This should be the customer ID of the logged in user
    return this.beneficiariesService.findAll(customerID);
  }

  @ApiOperation({ summary: 'Get a beneficiary by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.beneficiariesService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update a beneficiary by ID' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBeneficiaryDto: UpdateBeneficiaryDto,
  ) {
    return this.beneficiariesService.update(+id, updateBeneficiaryDto);
  }

  @ApiOperation({ summary: 'Delete a beneficiary by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.beneficiariesService.remove(+id);
  }
}
