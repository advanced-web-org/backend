import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from './dto/update-beneficiary.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';

@ApiTags('beneficiaries')
@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @ApiOperation({ summary: 'Create a beneficiary' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createBeneficiaryDto: CreateBeneficiaryDto,
    @CurrentUser() user: any,
  ) {
    return this.beneficiariesService.create(
      user.userId,
      createBeneficiaryDto.bank_id,
      createBeneficiaryDto.account_number,
      createBeneficiaryDto.nickname?.trim(),
    );
  }

  @ApiOperation({ summary: 'Get all beneficiaries' })
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: any) {
    return this.beneficiariesService.findAll(user.userId);
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
    return this.beneficiariesService.update(+id, updateBeneficiaryDto.nickname);
  }

  @ApiOperation({ summary: 'Delete a beneficiary by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.beneficiariesService.remove(+id);
  }
}
