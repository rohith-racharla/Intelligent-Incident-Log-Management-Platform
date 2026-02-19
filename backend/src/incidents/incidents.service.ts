import { Injectable } from '@nestjs/common';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateIncidentDto) {
    return this.prisma.incident.create({ data });
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.incident.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.incident.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  findOne(id: string) {
    return this.prisma.incident.findUnique({
      where: { id },
    });
  }

  async findLogs(id: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.log.findMany({
        where: { incident_id: id },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.log.count({ where: { incident_id: id } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  update(id: string, updateIncidentDto: UpdateIncidentDto) {
    return this.prisma.incident.update({
      where: { id },
      data: updateIncidentDto,
    });
  }

  remove(id: string) {
    return this.prisma.incident.delete({ where: { id } });
  }
}
