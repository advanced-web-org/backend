import { Controller } from '@nestjs/common';
import { StaffsService } from './staffs.service';

@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}
}
