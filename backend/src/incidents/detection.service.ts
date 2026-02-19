import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentsService } from './incidents.service';
import { Severity, IncidentStatus } from '@prisma/client';

@Injectable()
export class DetectionService {
  private readonly logger = new Logger(DetectionService.name);

  constructor(
    private prisma: PrismaService,
    private incidentsService: IncidentsService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    const lockId = 'detection_service_lock';
    const now = new Date();

    // 1. Try to acquire lock
    // Check if lock exists
    const existingLock = await this.prisma.cronLock.findUnique({
      where: { id: lockId },
    });

    if (existingLock) {
      if (existingLock.expiry > now) {
        this.logger.debug('Job locked by another instance. Skipping.');
        return;
      }
      // Expired, delete it so we can re-acquire
      await this.prisma.cronLock
        .delete({ where: { id: lockId } })
        .catch(() => {});
    }

    try {
      await this.prisma.cronLock.create({
        data: {
          id: lockId,
          lockedAt: now,
          expiry: new Date(now.getTime() + 9000), // 9s expiry
        },
      });
    } catch {
      this.logger.debug('Could not acquire lock (race condition). Skipping.');
      return;
    }

    try {
      // --- ORIGINAL LOGIC START ---
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentErrorCount = await this.prisma.log.count({
        where: {
          level: 'ERROR',
          timestamp: { gte: oneMinuteAgo },
          incident_id: null,
        },
      });

      this.logger.debug(
        `Checking for incidents... Found ${recentErrorCount} recent errors.`,
      );

      if (recentErrorCount > 5) {
        this.logger.warn(
          `High error rate detected (${recentErrorCount} errors). Creating incident...`,
        );

        const incident = await this.incidentsService.create({
          title: `High Error Rate Detected: ${recentErrorCount} errors in last minute`,
          severity: Severity.HIGH,
          status: IncidentStatus.OPEN,
        });

        this.logger.log(`Incident created: ${incident.id}`);

        await this.prisma.log.updateMany({
          where: {
            level: 'ERROR',
            timestamp: { gte: oneMinuteAgo },
            incident_id: null,
          },
          data: {
            incident_id: incident.id,
          },
        });
      }
      // --- ORIGINAL LOGIC END ---
    } finally {
      // Release lock
      await this.prisma.cronLock
        .delete({ where: { id: lockId } })
        .catch(() => {});
    }
  }
}
