import { Injectable, Logger } from '@nestjs/common';
import { UpdateCustomerDto } from 'src/customers/dto';
import { PrismaService } from 'src/prisma.service';
import { CreateStaffDto } from './dto/createStaff.dto';

@Injectable()
export class StaffsService {
  private readonly logger: Logger = new Logger(StaffsService.name);

  constructor(
    private readonly prismaService: PrismaService
  ) { }

  async getStaffByUserName(username: string): Promise<any> {
    try {
      const staff = await this.prismaService.staff.findUnique({
        where: {
          username
        }
      });

      return staff;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async getStaffById(id: number): Promise<any> {
    try {
      const staff = await this.prismaService.staff.findUnique({
        where: {
          staff_id: id
        }
      });

      return staff;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async updateStaff(username: string, payload: UpdateCustomerDto): Promise<any> {
    try {
      const staff = await this.prismaService.staff.update({
        where: {
          username
        },
        data: {
          ...payload
        }
      });

      return staff;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }

  async createStaff(payload: CreateStaffDto): Promise<any> {
    const { fullName, username, password, role } = payload;
    try {
      const staff = await this.prismaService.staff.create({
        data: {
          full_name: fullName,
          username,
          password,
          role: role as any
        }
      });

      return staff;
    } catch (error) {
      this.logger.error(error.message);
      throw new Error(error?.message || 'Something went wrong');
    }
  }
}
