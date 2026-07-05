import { ArticlesModule } from '@/modules/articles/articles.module';
import { ClientsModule } from '@/modules/clients/clients.module';
import { InvoicesModule } from '@/modules/invoices/invoices.module';
import { McpController } from './mcp.controller';
import { Module } from '@nestjs/common';
import { QuotesModule } from '@/modules/quotes/quotes.module';

@Module({
    imports: [QuotesModule, InvoicesModule, ClientsModule, ArticlesModule],
    controllers: [McpController],
})
export class McpModule { }
