import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ActiveCompany } from '@/decorators/active-company.decorator';
import { NotesService, CreateNoteDto } from './notes.service';

@ApiTags('notes')
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'List all notes', description: 'Returns all credit/debit notes for the company.' })
  @ApiResponse({ status: 200, description: 'Notes retrieved' })
  async findAll(@ActiveCompany() companyId: string) {
    return this.notesService.getNotes(companyId);
  }

  @Get('invoice/:invoiceId')
  @ApiOperation({ summary: 'Get notes for an invoice', description: 'Returns all credit/debit notes for a specific invoice.' })
  @ApiParam({ name: 'invoiceId', type: String })
  @ApiResponse({ status: 200, description: 'Notes retrieved' })
  async findByInvoice(@ActiveCompany() companyId: string, @Param('invoiceId') invoiceId: string) {
    return this.notesService.getNotesForInvoice(companyId, invoiceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a credit/debit note', description: 'Creates a new credit or debit note from an existing invoice.' })
  @ApiResponse({ status: 201, description: 'Note created' })
  async create(@ActiveCompany() companyId: string, @Body() dto: CreateNoteDto) {
    return this.notesService.createNote(companyId, dto);
  }
}
