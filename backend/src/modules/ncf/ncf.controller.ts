import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ActiveCompany } from '@/decorators/active-company.decorator';
import { CompanyRole } from '../../../prisma/generated/prisma/client';
import { Roles } from '@/decorators/roles.decorator';
import { NcfService, CreateNcfAuthorizationDto, EditNcfAuthorizationDto } from './ncf.service';

@ApiTags('ncf')
@Controller('ncf')
export class NcfController {
  constructor(private readonly ncfService: NcfService) {}

  @Get('types')
  @ApiOperation({ summary: 'Get NCF types', description: 'Returns all valid NCF document types for Dominican Republic.' })
  @ApiResponse({ status: 200, description: 'NCF types retrieved' })
  getNcfTypes() {
    return this.ncfService.getNcfTypes();
  }

  @Get()
  @ApiOperation({ summary: 'List NCF authorizations', description: 'Returns all NCF authorizations for the company.' })
  @ApiResponse({ status: 200, description: 'NCF authorizations retrieved' })
  async findAll(@ActiveCompany() companyId: string) {
    return this.ncfService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get NCF authorization', description: 'Returns a single NCF authorization by ID.' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'NCF authorization retrieved' })
  async findOne(@ActiveCompany() companyId: string, @Param('id') id: string) {
    return this.ncfService.findOne(companyId, id);
  }

  @Get('remaining/:ncfType')
  @ApiOperation({ summary: 'Get remaining NCF count', description: 'Returns the remaining available NCF count for a type.' })
  @ApiParam({ name: 'ncfType', type: String, description: 'NCF type code (01, 02, 03, etc.)' })
  @ApiResponse({ status: 200, description: 'Remaining count retrieved' })
  async getRemainingCount(@ActiveCompany() companyId: string, @Param('ncfType') ncfType: string) {
    const count = await this.ncfService.getRemainingCount(companyId, ncfType);
    return { ncfType, remaining: count };
  }

  @Post()
  @Roles(CompanyRole.OWNER, CompanyRole.ADMIN)
  @ApiOperation({ summary: 'Create NCF authorization', description: 'Registers a new NCF authorization range.' })
  @ApiResponse({ status: 201, description: 'NCF authorization created' })
  async create(@ActiveCompany() companyId: string, @Body() dto: CreateNcfAuthorizationDto) {
    return this.ncfService.create(companyId, dto);
  }

  @Patch(':id')
  @Roles(CompanyRole.OWNER, CompanyRole.ADMIN)
  @ApiOperation({ summary: 'Update NCF authorization', description: 'Updates an existing NCF authorization.' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'NCF authorization updated' })
  async update(@ActiveCompany() companyId: string, @Param('id') id: string, @Body() dto: EditNcfAuthorizationDto) {
    return this.ncfService.update(companyId, id, dto);
  }

  @Delete(':id')
  @Roles(CompanyRole.OWNER, CompanyRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate NCF authorization', description: 'Deactivates an NCF authorization.' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'NCF authorization deactivated' })
  async deactivate(@ActiveCompany() companyId: string, @Param('id') id: string) {
    return this.ncfService.deactivate(companyId, id);
  }
}
