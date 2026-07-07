import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryService],
})
export class InventoryModule { }
