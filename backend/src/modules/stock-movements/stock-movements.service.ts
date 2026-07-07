import { Injectable, NotFoundException } from '@nestjs/common';
import { StockMovement, StockMovementType } from '../../../prisma/generated/prisma/client';

import { logger } from '@/logger/logger.service';
import prisma from '@/prisma/prisma.service';

export interface CreateStockMovementDto {
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
}

@Injectable()
export class StockMovementsService {
  async create(companyId: string, dto: CreateStockMovementDto): Promise<StockMovement> {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: dto.inventoryItemId, companyId },
    });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const previousQty = item.quantity;
    let newQty: number;

    switch (dto.type) {
      case 'IN':
      case 'RETURN':
        newQty = previousQty + Math.abs(dto.quantity);
        break;
      case 'OUT':
      case 'SALE':
        newQty = previousQty - Math.abs(dto.quantity);
        break;
      case 'ADJUSTMENT':
        newQty = dto.quantity;
        break;
      default:
        newQty = previousQty + dto.quantity;
    }

    if (newQty < 0) {
      throw new Error('Insufficient stock');
    }

    const movement = await prisma.$transaction(async (tx) => {
      const mov = await tx.stockMovement.create({
        data: {
          inventoryItemId: dto.inventoryItemId,
          companyId,
          type: dto.type,
          quantity: dto.type === 'ADJUSTMENT' ? newQty - previousQty : dto.quantity,
          previousQty,
          newQty,
          reason: dto.reason ?? null,
          referenceType: dto.referenceType ?? null,
          referenceId: dto.referenceId ?? null,
        },
      });

      await tx.inventoryItem.update({
        where: { id: dto.inventoryItemId },
        data: { quantity: newQty },
      });

      return mov;
    });

    logger.info('Stock movement created', {
      category: 'inventory',
      details: { movementId: movement.id, itemId: dto.inventoryItemId, type: dto.type, previousQty, newQty },
    });

    return movement;
  }

  async findByItem(companyId: string, inventoryItemId: string): Promise<StockMovement[]> {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, companyId },
    });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    return prisma.stockMovement.findMany({
      where: { inventoryItemId, companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(companyId: string): Promise<StockMovement[]> {
    return prisma.stockMovement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: { inventoryItem: { select: { name: true, sku: true } } },
    });
  }
}
