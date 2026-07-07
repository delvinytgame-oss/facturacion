import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ActiveCompany } from '@/decorators/active-company.decorator';
import { StockMovementsService, CreateStockMovementDto } from './stock-movements.service';

@ApiTags('stock-movements')
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all stock movements', description: 'Returns all stock movements for the company.' })
  @ApiResponse({ status: 200, description: 'Stock movements retrieved' })
  async findAll(@ActiveCompany() companyId: string) {
    return this.stockMovementsService.findAll(companyId);
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'List movements for an item', description: 'Returns stock movements for a specific inventory item.' })
  @ApiParam({ name: 'itemId', type: String, description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Stock movements retrieved' })
  async findByItem(@ActiveCompany() companyId: string, @Param('itemId') itemId: string) {
    return this.stockMovementsService.findByItem(companyId, itemId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a stock movement', description: 'Records a new stock movement and updates the inventory quantity.' })
  @ApiResponse({ status: 201, description: 'Stock movement created' })
  async create(@ActiveCompany() companyId: string, @Body() dto: CreateStockMovementDto) {
    return this.stockMovementsService.create(companyId, dto);
  }
}
