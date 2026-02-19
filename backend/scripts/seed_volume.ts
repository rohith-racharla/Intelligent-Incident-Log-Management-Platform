import { PrismaClient, LogLevel, Severity, IncidentStatus } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting volume seeding...');

  try {
    // 1. Create 100 Incidents
    console.log('Seeding 100 Incidents...');
    const incidents = [];
    const now = new Date();
    for (let i = 0; i < 100; i++) {
     incidents.push({
        id: crypto.randomUUID(),
        title: `Incident ${i} - ${now.toISOString()}`,
        status: Object.values(IncidentStatus)[Math.floor(Math.random() * 3)],
        severity: Object.values(Severity)[Math.floor(Math.random() * 4)],
        created_at: now,
        updated_at: now,
      });
    }
    
    await prisma.incident.createMany({ data: incidents });
    const incidentIds = incidents.map(i => i.id);

    // 2. Create 10,000 Logs
    console.log('Seeding 10,000 Logs...');
    const logs = [];
    const BATCH_SIZE = 1000;
    
    for (let i = 0; i < 10000; i++) {
      const randomIncidentId = Math.random() > 0.7 ? incidentIds[Math.floor(Math.random() * incidentIds.length)] : null;
      
      logs.push({
        id: crypto.randomUUID(),
        service_id: `service-${Math.floor(Math.random() * 5)}`,
        level: Object.values(LogLevel)[Math.floor(Math.random() * 5)],
        message: `Log entry ${i} generated for volume testing. Random schema data: ${Math.random()}`,
        timestamp: new Date(),
        created_at: new Date(),
        metadata: { server: 'test-seed', load: Math.random() },
        incident_id: randomIncidentId,
      });

      if (logs.length >= BATCH_SIZE) {
        await prisma.log.createMany({ data: logs });
        console.log(`Inserted ${i + 1} logs...`);
        logs.length = 0;
      }
    }

    if (logs.length > 0) {
      await prisma.log.createMany({ data: logs });
    }

    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
