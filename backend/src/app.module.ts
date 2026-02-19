import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngestionModule } from './ingestion/ingestion.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { IncidentsModule } from './incidents/incidents.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [{
        ttl: Number(config.get('THROTTLE_TTL', 60000)),
        limit: Number(config.get('THROTTLE_LIMIT', 10)),
      }],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    ScheduleModule.forRoot(),
    IngestionModule,
    PrismaModule,
    IncidentsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
