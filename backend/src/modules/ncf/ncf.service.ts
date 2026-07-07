import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NcfAuthorization } from '../../../prisma/generated/prisma/client';

import { logger } from '@/logger/logger.service';
import prisma from '@/prisma/prisma.service';

export interface CreateNcfAuthorizationDto {
  ncfType: string;
  series: string;
  sequenceFrom: number;
  sequenceTo: number;
  expiresAt?: Date;
}

export interface EditNcfAuthorizationDto {
  series?: string;
  sequenceFrom?: number;
  sequenceTo?: number;
  currentSequence?: number;
  isActive?: boolean;
  expiresAt?: Date | null;
}

// NCF type codes for Dominican Republic
export const NCF_TYPES: Record<string, string> = {
  '01': 'Factura Fiscal',
  '02': 'Nota de Débito',
  '03': 'Nota de Crédito',
  '04': 'Factura Consumidor Final',
  '11': 'Comprobante para Exportación',
  '12': 'Factura para Regímenes Especiales',
  '13': 'Nota de Crédito para Exportación',
  '14': 'Comprobante de Compras',
  '15': 'Régimen Especial de Leyes Especiales',
  '16': 'Gubernamental',
};

@Injectable()
export class NcfService {
  async create(companyId: string, dto: CreateNcfAuthorizationDto): Promise<NcfAuthorization> {
    if (!NCF_TYPES[dto.ncfType]) {
      throw new BadRequestException(`Invalid NCF type: ${dto.ncfType}. Valid types: ${Object.keys(NCF_TYPES).join(', ')}`);
    }

    if (dto.sequenceFrom >= dto.sequenceTo) {
      throw new BadRequestException('sequenceFrom must be less than sequenceTo');
    }

    const existing = await prisma.ncfAuthorization.findFirst({
      where: {
        companyId,
        ncfType: dto.ncfType,
        series: dto.series,
        isActive: true,
      },
    });

    if (existing) {
      throw new BadRequestException(`An active NCF authorization already exists for type ${dto.ncfType} series ${dto.series}`);
    }

    const auth = await prisma.ncfAuthorization.create({
      data: {
        companyId,
        ncfType: dto.ncfType,
        series: dto.series,
        sequenceFrom: dto.sequenceFrom,
        sequenceTo: dto.sequenceTo,
        currentSequence: dto.sequenceFrom,
        expiresAt: dto.expiresAt ?? null,
      },
    });

    logger.info('NCF authorization created', {
      category: 'ncf',
      details: { authId: auth.id, companyId, ncfType: dto.ncfType, series: dto.series },
    });

    return auth;
  }

  async findAll(companyId: string): Promise<NcfAuthorization[]> {
    return prisma.ncfAuthorization.findMany({
      where: { companyId },
      orderBy: [{ ncfType: 'asc' }, { series: 'asc' }],
    });
  }

  async findOne(companyId: string, id: string): Promise<NcfAuthorization> {
    const auth = await prisma.ncfAuthorization.findFirst({ where: { id, companyId } });
    if (!auth) throw new NotFoundException('NCF authorization not found');
    return auth;
  }

  async update(companyId: string, id: string, dto: EditNcfAuthorizationDto): Promise<NcfAuthorization> {
    const existing = await this.findOne(companyId, id);

    const updated = await prisma.ncfAuthorization.update({
      where: { id },
      data: {
        series: dto.series ?? existing.series,
        sequenceFrom: dto.sequenceFrom ?? existing.sequenceFrom,
        sequenceTo: dto.sequenceTo ?? existing.sequenceTo,
        currentSequence: dto.currentSequence ?? existing.currentSequence,
        isActive: dto.isActive ?? existing.isActive,
        expiresAt: dto.expiresAt !== undefined ? dto.expiresAt : existing.expiresAt,
      },
    });

    logger.info('NCF authorization updated', { category: 'ncf', details: { authId: id, companyId } });
    return updated;
  }

  async deactivate(companyId: string, id: string): Promise<NcfAuthorization> {
    return this.update(companyId, id, { isActive: false });
  }

  async getNextNcf(companyId: string, ncfType: string): Promise<string> {
    const auth = await prisma.ncfAuthorization.findFirst({
      where: {
        companyId,
        ncfType,
        isActive: true,
      },
    });

    if (!auth) {
      throw new NotFoundException(`No active NCF authorization found for type ${ncfType}`);
    }

    if (auth.expiresAt && new Date(auth.expiresAt) < new Date()) {
      throw new BadRequestException(`NCF authorization for type ${ncfType} series ${auth.series} has expired`);
    }

    if (auth.currentSequence > auth.sequenceTo) {
      throw new BadRequestException(`NCF sequence exhausted for type ${ncfType} series ${auth.series}`);
    }

    const ncf = this.formatNcf(auth.series, ncfType, auth.currentSequence);

    await prisma.ncfAuthorization.update({
      where: { id: auth.id },
      data: { currentSequence: { increment: 1 } },
    });

    return ncf;
  }

  async getRemainingCount(companyId: string, ncfType: string): Promise<number> {
    const auths = await prisma.ncfAuthorization.findMany({
      where: { companyId, ncfType, isActive: true },
    });

    let total = 0;
    for (const auth of auths) {
      if (!auth.expiresAt || new Date(auth.expiresAt) >= new Date()) {
        total += Math.max(0, auth.sequenceTo - auth.currentSequence + 1);
      }
    }

    return total;
  }

  getNcfTypes(): Record<string, string> {
    return NCF_TYPES;
  }

  private formatNcf(series: string, ncfType: string, sequence: number): string {
    const paddedSequence = String(sequence).padStart(10, '0');
    return `${series}${ncfType}${paddedSequence}`;
  }
}
