import { InventoryItem } from '../../../prisma/generated/prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';

import { logger } from '@/logger/logger.service';
import prisma from '@/prisma/prisma.service';

export interface CreateInventoryItemDto {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  quantity?: number;
  minQuantity?: number;
  unitPrice?: number;
  costPrice?: number;
  location?: string;
}

export interface EditInventoryItemDto {
  name?: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  quantity?: number;
  minQuantity?: number;
  unitPrice?: number;
  costPrice?: number;
  location?: string | null;
  isActive?: boolean;
}

export interface InventoryFilterDto {
  category?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  location?: string;
  search?: string;
}

@Injectable()
export class InventoryService {
  async create(companyId: string, dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const item = await prisma.inventoryItem.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description ?? null,
        sku: dto.sku ?? null,
        category: dto.category ?? null,
        quantity: dto.quantity ?? 0,
        minQuantity: dto.minQuantity ?? 0,
        unitPrice: dto.unitPrice ?? 0,
        costPrice: dto.costPrice ?? 0,
        location: dto.location ?? null,
      },
    });

    logger.info('Inventory item created', { category: 'inventory', details: { itemId: item.id, companyId } });
    return item;
  }

  async findAll(companyId: string, filters?: InventoryFilterDto): Promise<InventoryItem[]> {
    const where: Record<string, unknown> = { companyId, isActive: true };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (filters?.stockStatus) {
      return items.filter((item) => {
        switch (filters.stockStatus) {
          case 'out_of_stock':
            return item.quantity === 0;
          case 'low_stock':
            return item.quantity > 0 && item.quantity <= item.minQuantity;
          case 'in_stock':
            return item.quantity > item.minQuantity;
          default:
            return true;
        }
      });
    }

    return items;
  }

  async findOne(companyId: string, id: string): Promise<InventoryItem | null> {
    return prisma.inventoryItem.findFirst({ where: { id, companyId } });
  }

  async update(companyId: string, id: string, dto: EditInventoryItemDto): Promise<InventoryItem> {
    const existing = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!existing) {
      logger.error('Inventory item not found', { category: 'inventory', details: { id } });
      throw new NotFoundException('Inventory item not found');
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description !== undefined ? dto.description : existing.description,
        sku: dto.sku !== undefined ? dto.sku : existing.sku,
        category: dto.category !== undefined ? dto.category : existing.category,
        quantity: dto.quantity ?? existing.quantity,
        minQuantity: dto.minQuantity ?? existing.minQuantity,
        unitPrice: dto.unitPrice ?? existing.unitPrice,
        costPrice: dto.costPrice ?? existing.costPrice,
        location: dto.location !== undefined ? dto.location : existing.location,
        isActive: dto.isActive ?? existing.isActive,
      },
    });

    logger.info('Inventory item updated', { category: 'inventory', details: { itemId: updated.id, companyId } });
    return updated;
  }

  async softDelete(companyId: string, id: string): Promise<InventoryItem> {
    const existing = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!existing) {
      logger.error('Inventory item not found', { category: 'inventory', details: { id } });
      throw new NotFoundException('Inventory item not found');
    }

    const deleted = await prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info('Inventory item deactivated', { category: 'inventory', details: { itemId: existing.id, companyId } });
    return deleted;
  }

  async updateStock(companyId: string, id: string, quantityChange: number): Promise<InventoryItem> {
    const existing = await prisma.inventoryItem.findFirst({ where: { id, companyId } });
    if (!existing) {
      throw new NotFoundException('Inventory item not found');
    }

    const newQuantity = existing.quantity + quantityChange;
    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: newQuantity },
    });

    logger.info('Inventory stock updated', { category: 'inventory', details: { itemId: id, oldQuantity: existing.quantity, newQuantity, change: quantityChange } });
    return updated;
  }

  async findLowStock(companyId: string): Promise<InventoryItem[]> {
    const items = await prisma.inventoryItem.findMany({
      where: { companyId, isActive: true },
      orderBy: { quantity: 'asc' },
    });

    return items.filter((item) => item.minQuantity > 0 && item.quantity <= item.minQuantity);
  }

  async getCategories(companyId: string): Promise<string[]> {
    const items = await prisma.inventoryItem.findMany({
      where: { companyId, isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return items.map((i) => i.category).filter(Boolean) as string[];
  }

  async getLocations(companyId: string): Promise<string[]> {
    const items = await prisma.inventoryItem.findMany({
      where: { companyId, isActive: true, location: { not: null } },
      select: { location: true },
      distinct: ['location'],
    });

    return items.map((i) => i.location).filter(Boolean) as string[];
  }
}
