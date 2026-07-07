import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Invoice, NoteType } from '../../../prisma/generated/prisma/client';

import { logger } from '@/logger/logger.service';
import prisma from '@/prisma/prisma.service';
import { NcfService } from '../ncf/ncf.service';
import { calculateDiscountedTotals } from '@/utils/financial';

export interface CreateNoteDto {
  originalInvoiceId: string;
  noteType: NoteType;
  items: {
    originalInvoiceItemId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    type?: string;
    order?: number;
  }[];
  notes?: string;
  reason?: string;
}

@Injectable()
export class NotesService {
  constructor(private readonly ncfService: NcfService) {}

  async createNote(companyId: string, dto: CreateNoteDto): Promise<Invoice> {
    const originalInvoice = await prisma.invoice.findFirst({
      where: { id: dto.originalInvoiceId, companyId, isActive: true },
      include: { items: true, client: true, company: true },
    });

    if (!originalInvoice) {
      throw new NotFoundException('Original invoice not found');
    }

    if (originalInvoice.noteType) {
      throw new BadRequestException('Cannot create a note from another note. Use the original invoice.');
    }

    const isExempt = !!originalInvoice.company.exemptVat;

    const itemsWithTotals = dto.items.map((item, index) => ({
      name: item.name,
      description: item.description ?? null,
      quantity: Math.abs(item.quantity),
      unitPrice: Math.abs(item.unitPrice),
      vatRate: isExempt ? 0 : (item.vatRate || 0),
      type: (item.type as any) || 'SERVICE',
      order: item.order ?? index,
      quoteItemId: null,
      inventoryItemId: null,
    }));

    const discountRate = originalInvoice.discountRate;
    const totals = calculateDiscountedTotals(
      itemsWithTotals.map(i => ({ ...i, quantity: dto.noteType === 'CREDIT' ? -Math.abs(i.quantity) : Math.abs(i.quantity) })),
      discountRate,
      { isVatExempt: isExempt },
    );

    let ncf: string | null = null;
    try {
      const ncfType = dto.noteType === 'CREDIT' ? '03' : '02';
      ncf = await this.ncfService.getNextNcf(companyId, ncfType);
    } catch (err) {
      logger.warn('Could not assign NCF to note, proceeding without it', {
        category: 'notes',
        details: { error: (err as Error).message },
      });
    }

    const note = await prisma.invoice.create({
      data: {
        companyId,
        clientId: originalInvoice.clientId,
        originalInvoiceId: dto.originalInvoiceId,
        noteType: dto.noteType,
        ncf,
        ncfType: dto.noteType === 'CREDIT' ? '03' : '02',
        status: 'DRAFT',
        currency: originalInvoice.currency,
        dueDate: new Date(),
        discountRate,
        totalHT: Math.abs(totals.totalHT),
        totalVAT: Math.abs(totals.totalVAT),
        totalTTC: Math.abs(totals.totalTTC),
        notes: dto.notes || `${dto.noteType === 'CREDIT' ? 'Nota de Crédito' : 'Nota de Débito'} - Ref: ${originalInvoice.rawNumber || originalInvoice.number}`,
        paymentMethod: originalInvoice.paymentMethod,
        paymentDetails: originalInvoice.paymentDetails,
        items: {
          create: itemsWithTotals.map(item => ({
            ...item,
            quantity: dto.noteType === 'CREDIT' ? -Math.abs(item.quantity) : Math.abs(item.quantity),
          })),
        },
      },
      include: {
        items: true,
        client: true,
        company: true,
        originalInvoice: { select: { id: true, rawNumber: true, number: true } },
      },
    });

    logger.info('Credit/Debit note created', {
      category: 'notes',
      details: {
        noteId: note.id,
        noteType: dto.noteType,
        originalInvoiceId: dto.originalInvoiceId,
        ncf,
      },
    });

    return note;
  }

  async getNotesForInvoice(companyId: string, invoiceId: string): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: {
        companyId,
        originalInvoiceId: invoiceId,
        isActive: true,
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNotes(companyId: string): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: {
        companyId,
        noteType: { not: null },
        isActive: true,
      },
      include: { items: true, client: true, originalInvoice: { select: { id: true, rawNumber: true, number: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
