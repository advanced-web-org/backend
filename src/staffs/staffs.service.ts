import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

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
}
