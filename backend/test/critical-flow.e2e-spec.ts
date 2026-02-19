/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Critical Flow (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let incidentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prismaService.user.deleteMany({ where: { email: 'e2e@test.com' } });
    if (incidentId) {
      await prismaService.log.deleteMany({
        where: { incident_id: incidentId },
      });
      await prismaService.incident.delete({ where: { id: incidentId } });
    }
    await app.close();
  });

  it('1. Register User', async () => {
    // Cleanup first
    await prismaService.user.deleteMany({ where: { email: 'e2e@test.com' } });

    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'e2e@test.com',
        password: 'Password123!',
        role: 'ADMIN',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.email).toBe('e2e@test.com');
        expect(res.body.password).toBeUndefined(); // Security check
      });
  });

  it('2. Login', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'e2e@test.com',
        password: 'Password123!',
      })
      .expect(200);

    expect(res.body.access_token).toBeDefined();
    authToken = res.body.access_token;
  });

  it('3. Create Incident', async () => {
    const res = await request(app.getHttpServer())
      .post('/incidents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'E2E Test Incident',
        severity: 'HIGH',
        status: 'OPEN',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    incidentId = res.body.id;
  });

  it('4. Ingest Log', async () => {
    return request(app.getHttpServer())
      .post('/ingest')
      .send({
        service_id: 'e2e-service',
        level: 'ERROR',
        message: 'Critical failure detected',
        timestamp: new Date().toISOString(),
        metadata: { region: 'us-east-1' },
      })
      .expect(201);
  });
});
