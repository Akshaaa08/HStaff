import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service.js';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async getAllServices() {
    return this.servicesService.findAll();
  }

  @Get(':name')
  async getServiceByName(@Param('name') name: string) {
    const service = await this.servicesService.findByName(name);
    if (!service) {
      throw new NotFoundException(`Service '${name}' not found`);
    }
    return service;
  }
}
