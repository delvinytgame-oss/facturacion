import { Injectable, BadRequestException } from '@nestjs/common';
import { getCrmSupabaseClient, CrmProduct } from '@/lib/crm-supabase';
import { logger } from '@/logger/logger.service';
import prisma from '@/prisma/prisma.service';

export interface ImportProductsDto {
  productIds: string[];
  accountId: string;
}

export interface DeductStockItem {
  productId: string;
  quantity: number;
}

@Injectable()
export class CrmSyncService {
  private getCrmClient() {
    const client = getCrmSupabaseClient();
    if (!client) {
      throw new BadRequestException(
        'CRM connection not configured. Set CRM_SUPABASE_URL and CRM_SUPABASE_ANON_KEY in .env',
      );
    }
    return client;
  }

  async getProducts(accountId: string, search?: string): Promise<CrmProduct[]> {
    const crm = this.getCrmClient();

    let query = crm
      .from('products')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('CRM products fetch failed', { category: 'crm-sync', details: { error: error.message } });
      throw new BadRequestException(`CRM error: ${error.message}`);
    }

    return data || [];
  }

  async importProducts(companyId: string, dto: ImportProductsDto): Promise<{ imported: number; skipped: number }> {
    const crm = this.getCrmClient();

    const { data: products, error } = await crm
      .from('products')
      .select('*')
      .in('id', dto.productIds)
      .eq('account_id', dto.accountId);

    if (error) {
      throw new BadRequestException(`CRM error: ${error.message}`);
    }

    if (!products || products.length === 0) {
      throw new BadRequestException('No products found in CRM');
    }

    let imported = 0;
    let skipped = 0;

    for (const product of products) {
      const existing = await prisma.inventoryItem.findFirst({
        where: {
          companyId,
          sku: product.sku || undefined,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.inventoryItem.create({
        data: {
          companyId,
          name: product.name,
          description: product.description || null,
          sku: product.sku || null,
          category: product.category || null,
          quantity: product.stock || 0,
          minQuantity: product.min_stock || 0,
          unitPrice: Number(product.price) || 0,
          costPrice: Number(product.cost) || 0,
          location: null,
        },
      });

      imported++;
    }

    logger.info('CRM products imported', {
      category: 'crm-sync',
      details: { companyId, imported, skipped, total: products.length },
    });

    return { imported, skipped };
  }

  async deductStock(items: DeductStockItem[]): Promise<void> {
    const crm = this.getCrmClient();

    for (const item of items) {
      const { data: product, error: fetchError } = await crm
        .from('products')
        .select('id, stock')
        .eq('id', item.productId)
        .single();

      if (fetchError || !product) {
        logger.warn('CRM product not found for stock deduction', {
          category: 'crm-sync',
          details: { productId: item.productId },
        });
        continue;
      }

      const newStock = Math.max(0, product.stock - item.quantity);

      const { error: updateError } = await crm
        .from('products')
        .update({
          stock: newStock,
          status: newStock === 0 ? 'out_of_stock' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.productId);

      if (updateError) {
        logger.error('CRM stock deduction failed', {
          category: 'crm-sync',
          details: { productId: item.productId, error: updateError.message },
        });
      } else {
        logger.info('CRM stock deducted', {
          category: 'crm-sync',
          details: { productId: item.productId, oldStock: product.stock, newStock, deducted: item.quantity },
        });
      }
    }
  }

  async syncStockFromCrm(companyId: string, accountId: string): Promise<{ updated: number }> {
    const crm = this.getCrmClient();

    const { data: crmProducts, error } = await crm
      .from('products')
      .select('id, name, sku, stock, price, cost, min_stock, category, description, status')
      .eq('account_id', accountId)
      .eq('status', 'active');

    if (error) {
      throw new BadRequestException(`CRM error: ${error.message}`);
    }

    if (!crmProducts || crmProducts.length === 0) {
      return { updated: 0 };
    }

    let updated = 0;

    for (const product of crmProducts) {
      const existing = await prisma.inventoryItem.findFirst({
        where: { companyId, sku: product.sku || undefined },
      });

      if (existing) {
        await prisma.inventoryItem.update({
          where: { id: existing.id },
          data: {
            quantity: product.stock || 0,
            unitPrice: Number(product.price) || existing.unitPrice,
            costPrice: Number(product.cost) || existing.costPrice,
            minQuantity: product.min_stock || existing.minQuantity,
            category: product.category || existing.category,
            description: product.description || existing.description,
          },
        });
        updated++;
      }
    }

    logger.info('Stock synced from CRM', { category: 'crm-sync', details: { companyId, updated } });
    return { updated };
  }

  async getAccounts(): Promise<{ id: string; name: string }[]> {
    const crm = this.getCrmClient();

    const { data, error } = await crm
      .from('accounts')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      throw new BadRequestException(`CRM error: ${error.message}`);
    }

    return data || [];
  }
}
