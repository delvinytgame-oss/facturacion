import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ActiveCompany } from '@/decorators/active-company.decorator';
import { CrmSyncService, ImportProductsDto, DeductStockItem } from './crm-sync.service';

@ApiTags('crm-sync')
@Controller('crm-sync')
export class CrmSyncController {
  constructor(private readonly crmSyncService: CrmSyncService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List CRM accounts', description: 'Returns all accounts from the CRM database.' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved' })
  async getAccounts() {
    return this.crmSyncService.getAccounts();
  }

  @Get('products')
  @ApiOperation({ summary: 'List CRM products', description: 'Returns products from the CRM for a given account.' })
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  async getProducts(
    @Query('accountId') accountId: string,
    @Query('search') search?: string,
  ) {
    return this.crmSyncService.getProducts(accountId, search);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import products from CRM', description: 'Imports selected CRM products into the inventory.' })
  @ApiResponse({ status: 200, description: 'Products imported' })
  async importProducts(
    @ActiveCompany() companyId: string,
    @Body() dto: ImportProductsDto,
  ) {
    return this.crmSyncService.importProducts(companyId, dto);
  }

  @Post('sync-stock')
  @ApiOperation({ summary: 'Sync stock from CRM', description: 'Updates inventory quantities from CRM stock levels.' })
  @ApiResponse({ status: 200, description: 'Stock synced' })
  async syncStock(
    @ActiveCompany() companyId: string,
    @Body() body: { accountId: string },
  ) {
    return this.crmSyncService.syncStockFromCrm(companyId, body.accountId);
  }

  @Post('deduct-stock')
  @ApiOperation({ summary: 'Deduct stock in CRM', description: 'Reduces stock in CRM after invoice creation.' })
  @ApiResponse({ status: 200, description: 'Stock deducted' })
  async deductStock(@Body() body: { items: DeductStockItem[] }) {
    return this.crmSyncService.deductStock(body.items);
  }
}
