import { ToolDescriptor } from './types';
import { createArticleTool } from './create-article.tool';
import { createClientTool } from './create-client.tool';
import { createInvoiceFromQuoteTool } from './create-invoice-from-quote.tool';
import { createInvoiceTool } from './create-invoice.tool';
import { createQuoteTool } from './create-quote.tool';
import { listArticlesTool } from './list-articles.tool';

// Every new tool is one file + one entry here — mcp-server.factory.ts is the
// only place that touches the SDK's registration API.
export const TOOL_REGISTRY: ToolDescriptor<any>[] = [
    createQuoteTool,
    createInvoiceTool,
    createInvoiceFromQuoteTool,
    createClientTool,
    createArticleTool,
    listArticlesTool,
];
