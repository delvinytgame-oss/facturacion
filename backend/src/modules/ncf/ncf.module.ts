import { Module } from '@nestjs/common';
import { NcfController } from './ncf.controller';
import { NcfService } from './ncf.service';

@Module({
  providers: [NcfService],
  controllers: [NcfController],
  exports: [NcfService],
})
export class NcfModule {}
