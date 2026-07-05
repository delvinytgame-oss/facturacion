// One scope per MCP tool that mutates or reads company data (see
// backend/src/modules/mcp/). Deliberately coarse — no per-tool granularity
// beyond resource:action, and no scopes for actions with no tool yet
// (e.g. quotes/invoices/clients have no read/delete scopes since there's
// no such MCP tool). A plain string array rather than a Postgres enum so
// adding a new scope later is a pure app-code change, no migration.
export const API_KEY_SCOPES = [
    'quotes:write',
    'invoices:write',
    'clients:write',
    'articles:write',
    'articles:read',
] as const;

export type ApiKeyScope = typeof API_KEY_SCOPES[number];

export function isApiKeyScope(value: string): value is ApiKeyScope {
    return (API_KEY_SCOPES as readonly string[]).includes(value);
}
