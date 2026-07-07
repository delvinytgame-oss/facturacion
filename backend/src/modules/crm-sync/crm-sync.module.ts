import { Module } from '@nestjs/common';
import { CrmSyncController } from './crm-sync.controller';
import { CrmSyncService } from './crm-sync.service';

@Module({
  providers: [CrmSyncService],
  controllers: [CrmSyncController],
  exports: [CrmSyncService],
})
export class CrmSyncModule {}
