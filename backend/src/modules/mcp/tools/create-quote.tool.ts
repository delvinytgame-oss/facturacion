import { Currency, ItemType } from '../../../../prisma/generated/prisma/client';

import { ToolDescriptor } from './types';
import { z } from 'zod';

const itemSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number(),
    unitPrice: z.number(),
    vatRate: z.number(),
    type: z.nativeEnum(ItemType),
    order: z.number(),
});

const inputSchema = {
    clientId: z.string().describe('ID of the client this quote is for'),
    title: z.string().optional(),
    validUntil: z.string().datetime().optional().describe('ISO 8601 date-time'),
    currency: z.nativeEnum(Currency).optional(),
    discountRate: z.number().optional(),
    paymentMethod: z.string().optional(),
    paymentDetails: z.string().optional(),
    paymentMethodId: z.string().optional(),
    notes: z.string(),
    items: z.array(itemSchema).min(1),
};

const outputSchema = {
    id: z.string(),
    number: z.number(),
    rawNumber: z.string().nullable(),
};

export const createQuoteTool: ToolDescriptor<typeof inputSchema> = {
    name: 'create_quote',
    description: 'Create a new quote for a client in the active company.',
    scope: 'quotes:write',
    inputSchema,
    outputSchema,
    handler: async (ctx, input) => {
        const quote = await ctx.services.quotesService.createQuote(ctx.companyId, {
            ...input,
            validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        });

        return {
            content: [{ type: 'text', text: `Quote ${quote.rawNumber || quote.number} created (id: ${quote.id}).` }],
            structuredContent: { id: quote.id, number: quote.number, rawNumber: quote.rawNumber ?? null },
        };
    },
};
