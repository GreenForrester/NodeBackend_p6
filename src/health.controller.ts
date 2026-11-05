import {
  Controller,
  Get,
  SetMetadata,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
@SetMetadata('publicHealth', true)
@Controller('health')
export class HealthController {
  constructor(private readonly db: DataSource) {}
  @Get('live') live() {
    return { status: 'ok' };
  }
  @Get('ready') async ready() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
  }
}
