import { Module } from '@nestjs/common';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';

@Module({
  providers: [StockMovementsService],
  controllers: [StockMovementsController],
  exports: [StockMovementsService],
})
export class StockMovementsModule {}
