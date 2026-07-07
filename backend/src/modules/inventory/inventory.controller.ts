import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  InventoryService,
  CreateInventoryItemDto,
  EditInventoryItemDto,
} from './inventory.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ActiveCompany } from '@/decorators/active-company.decorator';
import { CompanyRole } from '../../../prisma/generated/prisma/client';
import { Roles } from '@/decorators/roles.decorator';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) { }

  @Get()
  @ApiOperation({ summary: 'List inventory items', description: 'Returns all active inventory items for the company with optional filters.' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'stockStatus', required: false, enum: ['in_stock', 'low_stock', 'out_of_stock'], description: 'Filter by stock status' })
  @ApiQuery({ name: 'location', required: false, description: 'Filter by location' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, description, or SKU' })
  @ApiResponse({ status: 200, description: 'Inventory items retrieved' })
  async findAll(
    @ActiveCompany() companyId: string,
    @Query('category') category?: string,
    @Query('stockStatus') stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock',
    @Query('location') location?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.findAll(companyId, { category, stockStatus, location, search });
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock items', description: 'Returns inventory items where quantity is at or below minimum.' })
  @ApiResponse({ status: 200, description: 'Low stock items retrieved' })
  async findLowStock(@ActiveCompany() companyId: string) {
    return this.inventoryService.findLowStock(companyId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get categories', description: 'Returns all unique categories used in inventory.' })
  @ApiResponse({ status: 200, description: 'Categories retrieved' })
  async getCategories(@ActiveCompany() companyId: string) {
    return this.inventoryService.getCategories(companyId);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get locations', description: 'Returns all unique locations used in inventory.' })
  @ApiResponse({ status: 200, description: 'Locations retrieved' })
  async getLocations(@ActiveCompany() companyId: string) {
    return this.inventoryService.getLocations(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inventory item', description: 'Returns a single inventory item by ID.' })
  @ApiParam({ name: 'id', type: String, description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Inventory item retrieved' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  async findOne(@ActiveCompany() companyId: string, @Param('id') id: string) {
    const item = await this.inventoryService.findOne(companyId, id);
    if (!item) {
      return { message: 'Not found' };
    }
    return item;
  }

  @Post()
  @ApiOperation({ summary: 'Create an inventory item', description: 'Adds a new inventory item to track stock.' })
  @ApiResponse({ status: 201, description: 'Inventory item created' })
  async create(@ActiveCompany() companyId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inventory item', description: 'Updates an existing inventory item by ID.' })
  @ApiParam({ name: 'id', type: String, description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Inventory item updated' })
  async update(@ActiveCompany() companyId: string, @Param('id') id: string, @Body() dto: EditInventoryItemDto) {
    return this.inventoryService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(CompanyRole.OWNER, CompanyRole.ADMIN)
  @ApiOperation({ summary: 'Delete an inventory item', description: 'Soft-deletes an inventory item by ID.' })
  @ApiParam({ name: 'id', type: String, description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Inventory item deleted' })
  async remove(@ActiveCompany() companyId: string, @Param('id') id: string) {
    return this.inventoryService.softDelete(companyId, id);
  }

  @Post(':id/stock')
  @ApiOperation({ summary: 'Update stock quantity', description: 'Adjusts the stock quantity for an inventory item.' })
  @ApiParam({ name: 'id', type: String, description: 'Inventory item ID' })
  @ApiResponse({ status: 200, description: 'Stock updated' })
  async updateStock(
    @ActiveCompany() companyId: string,
    @Param('id') id: string,
    @Body() body: { quantityChange: number },
  ) {
    return this.inventoryService.updateStock(companyId, id, body.quantityChange);
  }
}
