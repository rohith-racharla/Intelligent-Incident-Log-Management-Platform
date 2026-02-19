import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { CreateLogDto } from './dto/create-log.dto';
import { PrismaService } from '../prisma/prisma.service';
import { LogLevel, Prisma } from '@prisma/client';
import { Interval, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class IngestionService implements OnModuleDestroy {
  private readonly logger = new Logger(IngestionService.name);
  private logBuffer: Prisma.LogCreateManyInput[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly INTERVAL_NAME = 'flush_logs';

  constructor(
    private prisma: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async processLog(logDto: CreateLogDto) {
    this.logBuffer.push({
      service_id: logDto.service_id,
      level: logDto.level as LogLevel,
      message: logDto.message,
      timestamp: new Date(logDto.timestamp),
      metadata: logDto.metadata || {},
    });

    if (this.logBuffer.length >= this.BATCH_SIZE) {
      await this.flushLogs();
    }
  }

  @Interval('flush_logs', 5000)
  async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logsToInsert = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.prisma.log.createMany({
        data: logsToInsert,
      });
      this.logger.log(`Flushed ${logsToInsert.length} logs to database.`);
    } catch (error) {
      this.logger.error('Failed to flush logs', error.stack);
    }
  }

  async onModuleDestroy() {
    try {
        if (this.schedulerRegistry.doesExist('interval', this.INTERVAL_NAME)) {
            this.schedulerRegistry.deleteInterval(this.INTERVAL_NAME);
        }
        await this.flushLogs();
    } catch (e) {
        // Ignore errors during shutdown
    }
  }
}
