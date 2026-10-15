import { Controller, Get, Param, Query } from '@nestjs/common';
import { WorkersService } from './workers.service.js';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  async getAllWorkers(
    @Query('service') service?: string,
    @Query('city') city?: string,
    @Query('sort') sort?: string,
  ) {
    return this.workersService.findAll(service, city, sort);
  }

  @Get(':id')
  async getWorkerById(@Param('id') id: string) {
    return this.workersService.findByWorkerId(id);
  }
}
