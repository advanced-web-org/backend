import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { CreateStaffDto } from './dto/createStaff.dto';
import { UpdateStaffDto } from './dto/updateStaff.dto';

@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  @Get()
  async findAll() {
    return await this.staffsService.findAll();
  }

  @Get('/username/:username')
  async findOneByUsername(@Param('username') username: string) {
    return await this.staffsService.getStaffByUserName(username);
  }

  @Get('/id/:staff_id')
  async findOneById(@Param('staff_id') staff_id: number) {
    return await this.staffsService.getStaffById(staff_id);
  }

  @Post()
  async create(@Body() createStaffDto: CreateStaffDto) {
    return await this.staffsService.createStaff(createStaffDto);
  }

  @Post('/update')
  async update(
    @Body() updateStaffDto: {
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

  @Post('/delete/:staff_id')
  async remove(@Param('staff_id') staff_id: number) {
    return this.staffsService.remove(staff_id);
  }
}
