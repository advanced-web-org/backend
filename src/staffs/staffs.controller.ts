import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { CreateStaffDto } from './dto/createStaff.dto';
import { UpdateStaffDto } from './dto/updateStaff.dto';
import { ApiOperation, ApiTags, ApiProperty, ApiBody } from '@nestjs/swagger';

@ApiTags('staffs')
@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all staffs' })
  async findAll() {
    return await this.staffsService.findAll();
  }

  @ApiOperation({ summary: 'Get staff by username' })
  @Get('/username/:username')
  async findOneByUsername(@Param('username') username: string) {
    return await this.staffsService.getStaffByUserName(username);
  }

  @ApiOperation({ summary: 'Get staff by ID' })
  @Get('/id/:staff_id')
  async findOneById(@Param('staff_id') staff_id: number) {
    return await this.staffsService.getStaffById(staff_id);
  }

  @ApiOperation({ summary: 'Create a staff' })
  @Post()
  async create(@Body() createStaffDto: CreateStaffDto) {
    return await this.staffsService.createStaff(createStaffDto);
  }

  @ApiOperation({ summary: 'Update a staff' })
  @Post('/update')
  async update(
    @Body()
    updateStaffDto: {
      username: string;
      fullName: string;
      role: string;
    },
  ) {
    console.log('updateStaffDto', updateStaffDto);
    return this.staffsService.updateStaff(updateStaffDto.username!, {
      full_name: updateStaffDto.fullName,
      role: updateStaffDto.role,
      username: updateStaffDto.username,
    });
  }

  @ApiOperation({ summary: 'Delete a staff' })
  @Post('/delete/:staff_id')
  async remove(@Param('staff_id') staff_id: number) {
    return this.staffsService.remove(staff_id);
  }
}
