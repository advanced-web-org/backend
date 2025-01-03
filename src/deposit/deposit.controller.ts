import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DepositService } from './deposit.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UpdateDepositDto } from './dto/update-deposit.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('deposits')
@Controller('deposits')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @ApiOperation({ summary: 'Create a deposit' })
  @Post()
  async create(@Body() createDepositDto: CreateDepositDto) {
    return await this.depositService.create(createDepositDto);
  }

  @ApiOperation({ summary: 'Get all deposits' })
  @Get()
  findAll() {
    return this.depositService.findAll();
  }

  @ApiOperation({ summary: 'Get a deposit by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.depositService.findOne(+id);
  }

  @ApiOperation({ summary: 'Update a deposit by ID' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDepositDto: UpdateDepositDto) {
    return this.depositService.update(+id, updateDepositDto);
  }

  @ApiOperation({ summary: 'Delete a deposit by ID' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.depositService.remove(+id);
  }
}
