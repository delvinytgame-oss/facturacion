import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ExpensesService,
  CreateExpenseDto,
  EditExpenseDto,
} from './expenses.service';

@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) { }

  @Get()
  @ApiOperation({ summary: 'List expenses', description: 'Returns all recorded expenses.' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved' })
  async findAll() {
    return this.expensesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an expense', description: 'Returns a single expense by ID.' })
  @ApiParam({ name: 'id', type: String, description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense retrieved' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async findOne(@Param('id') id: string) {
    const expense = await this.expensesService.findOne(id);
    if (!expense) {
      return { message: 'Not found' };
    }
    return expense;
  }

  @Post()
  @ApiOperation({ summary: 'Create an expense', description: 'Records a new expense.' })
  @ApiResponse({ status: 201, description: 'Expense created' })
  async create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense', description: 'Updates an existing expense by ID.' })
  @ApiParam({ name: 'id', type: String, description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense updated' })
  async update(@Param('id') id: string, @Body() dto: EditExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense', description: 'Permanently deletes an expense by ID.' })
  @ApiParam({ name: 'id', type: String, description: 'Expense ID' })
  @ApiResponse({ status: 200, description: 'Expense deleted' })
  async remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
