import { Injectable, Logger } from '@nestjs/common';
import { Staff } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateStaffDto } from './dto/createStaff.dto';
import { UpdateStaffDto } from './dto/updateStaff.dto';

@Injectable()
export class StaffsService {
  private readonly logger: Logger = new Logger(StaffsService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async getStaffByUserName(username: string): Promise<Staff | null> {
    try {
      const staff = await this.prismaService.staff.findUnique({
        where: {
          username,
        },
      });

      return staff;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async getStaffById(id: number): Promise<Staff | null> {
    try {
      const staff = await this.prismaService.staff.findUnique({
        where: {
          staff_id: id,
        },
      });

      return staff;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async updateStaff(username: string, payload: UpdateStaffDto): Promise<Staff> {
    try {
      const staff = await this.prismaService.staff.update({
        where: {
          username: username,
        },
        data: {
          ...payload,
          role: payload.role as any,
        }
      });

      return staff;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async createStaff(payload: CreateStaffDto): Promise<Staff> {
    const { fullName, username, password, role } = payload;
    console.log(payload);
    try {
      const staff = await this.prismaService.staff.create({
        data: {
          full_name: fullName,
          username,
          password,
          role: role as any,
        },
      });

      return staff;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async findAll(): Promise<Staff[]> {
    try {
      const staffs = await this.prismaService.staff.findMany({
        where: {
          role: {
            not: 'admin',
          },
        },
      });

      return staffs;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async remove(staff_id: number): Promise<Staff> {
    try {
      const staff = await this.prismaService.staff.delete({
        where: {
          staff_id,
        },
      });

      return staff;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }
}
