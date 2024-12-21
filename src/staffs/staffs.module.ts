import { Module } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { StaffsController } from './staffs.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [StaffsController],
  providers: [StaffsService, PrismaService],
})
export class StaffsModule {}
