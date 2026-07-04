import { BadRequestException, Injectable } from '@nestjs/common';
import { Currency, Expense } from '../../../prisma/generated/prisma/client';

import { logger } from '@/logger/logger.service';
import prisma from '@/prisma/prisma.service';

export interface CreateExpenseDto {
  description: string;
  amount: number;
  currency?: Currency;
  date?: Date;
  notes?: string;
}

export interface EditExpenseDto {
  description?: string;
  amount?: number;
  currency?: Currency;
  date?: Date;
  notes?: string | null;
}

@Injectable()
export class ExpensesService {
  async create(dto: CreateExpenseDto): Promise<Expense> {
    const company = await prisma.company.findFirst();
    if (!company) {
      logger.error('No company found. Please create a company first.', { category: 'expense' });
      throw new BadRequestException('No company found. Please create a company first.');
    }

    const expense = await prisma.expense.create({
      data: {
        companyId: company.id,
        description: dto.description,
        amount: dto.amount,
        currency: dto.currency ?? company.currency,
        date: dto.date ?? new Date(),
        notes: dto.notes,
      },
    });

    logger.info('Expense created', { category: 'expense', details: { expenseId: expense.id, companyId: company.id } });

    return expense;
  }

  async findAll(): Promise<Expense[]> {
    const company = await prisma.company.findFirst();
    if (!company) {
      logger.error('No company found. Please create a company first.', { category: 'expense' });
      throw new BadRequestException('No company found. Please create a company first.');
    }

    return prisma.expense.findMany({
      where: { companyId: company.id },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string): Promise<Expense | null> {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return null;
    const company = await prisma.company.findFirst();
    if (!company || expense.companyId !== company.id) {
      return null;
    }
    return expense;
  }

  async update(id: string, dto: EditExpenseDto): Promise<Expense> {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      logger.error('Expense not found', { category: 'expense', details: { id } });
      throw new BadRequestException('Expense not found');
    }

    const company = await prisma.company.findFirst();
    if (!company || existing.companyId !== company.id) {
      logger.error('Expense not found', { category: 'expense', details: { id } });
      throw new BadRequestException('Expense not found');
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        description: dto.description ?? existing.description,
        amount: dto.amount ?? existing.amount,
        currency: dto.currency ?? existing.currency,
        date: dto.date ?? existing.date,
        notes: dto.notes === undefined ? existing.notes : dto.notes,
      },
    });

    logger.info('Expense updated', { category: 'expense', details: { expenseId: updated.id, companyId: company.id } });

    return updated;
  }

  async remove(id: string): Promise<Expense> {
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      logger.error('Expense not found', { category: 'expense', details: { id } });
      throw new BadRequestException('Expense not found');
    }

    const company = await prisma.company.findFirst();
    if (!company || existing.companyId !== company.id) {
      logger.error('Expense not found', { category: 'expense', details: { id } });
      throw new BadRequestException('Expense not found');
    }

    const deleted = await prisma.expense.delete({ where: { id } });

    logger.info('Expense deleted', { category: 'expense', details: { expenseId: id, companyId: company.id } });

    return deleted;
  }
}
