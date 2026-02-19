import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';

import { PrismaService } from '../prisma/prisma.service';

describe('IngestionService', () => {
  let service: IngestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: PrismaService,
          useValue: {
            log: {
              create: jest.fn(),
              createMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
