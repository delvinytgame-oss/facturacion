---
sidebar_position: 5
---

# MCP server

Invoicerr exposes a [Model Context Protocol](https://modelcontextprotocol.io) server so AI agents (OpenWebUI, Claude Code, ...) can create quotes, invoices, clients, and articles directly from a chat, reusing the same service layer as the REST API.

- **Endpoint**: `POST /api/mcp`
- **Transport**: Streamable HTTP, stateless (a fresh in-memory MCP server is built per request — there's no session state to manage or expire)
- **Auth**: `Authorization: Bearer <api-key>` — the same API keys used elsewhere, see [Authentication](./authentication.md#api-key-authentication)

## API key scopes

Every API key has a `scopes: string[]` column (`backend/src/modules/api-keys/scopes.ts`). Create or edit a key from **Settings → API Keys** and tick the scopes it needs:

| Scope | Grants |
|---|---|
| `quotes:write` | `create_quote` |
| `invoices:write` | `create_invoice`, `create_invoice_from_quote` |
| `clients:write` | `create_client` |
| `articles:write` | `create_article` |
| `articles:read` | `list_articles` |

A key with no scopes ticked can still authenticate, but `tools/list` returns an empty toolset — harmless, but useless. Keys created before scopes existed were backfilled with all five scopes so existing integrations kept working; grant scopes deliberately for new keys instead of relying on that default.

Tools the key's scopes don't cover don't just error on call — they're absent from `tools/list` entirely, so an agent planning a task only ever sees what it can actually do.

## Available tools

| Tool | Scope | Maps to |
|---|---|---|
| `create_quote` | `quotes:write` | `QuotesService.createQuote` |
| `create_invoice` | `invoices:write` | `InvoicesService.createInvoice` |
| `create_invoice_from_quote` | `invoices:write` | `InvoicesService.createInvoiceFromQuote` |
| `create_client` | `clients:write` | `ClientsService.createClient` |
| `create_article` | `articles:write` | `ArticlesService.create` |
| `list_articles` | `articles:read` | `ArticlesService.findAll` |

Each tool is a thin adapter (`backend/src/modules/mcp/tools/*.ts`) — it validates input against a zod schema mirroring the equivalent REST DTO, calls the existing service with the API key's `companyId`, and returns both a short text summary and structured content (e.g. `{ id, name }`) so an agent can chain calls (create a client, then a quote for that client) without having to parse prose.

There's no separate "created via MCP" audit trail — creations show up the same way any other API-key-driven change does (`ApiKey.lastUsedAt`, and whatever webhooks the underlying service already dispatches on creation).

## OpenWebUI configuration

1. **Admin Panel → Settings → External Tools → +**
2. Type: **MCP (Streamable HTTP)**
3. URL: `https://<your-invoicerr-domain>/api/mcp`
4. Auth: **Bearer** → paste the API key
5. Give it a name, save

Tools matching the key's granted scopes appear automatically in chats that have tool access enabled.

## Claude Code configuration

```bash
claude mcp add --transport http invoicerr https://<your-invoicerr-domain>/api/mcp \
  --header "Authorization: Bearer <your-api-key>"
```

Run `/mcp` inside a Claude Code session afterwards to confirm the connection and see the available tools.

## Known limitation: claude.ai / Claude Desktop / Cowork

The "Custom Connectors" UI in claude.ai, Claude Desktop, and Cowork currently only supports **OAuth-based** authentication for remote MCP servers — there's no field for a static Bearer token/API key. Because of that, the Invoicerr MCP server **cannot be added through that specific UI today**.

It works from OpenWebUI, Claude Code, and any other client that lets you attach a custom `Authorization` header to a Streamable HTTP connection (including the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), useful for testing). Supporting the claude.ai connector UI would require standing up a full OAuth 2.1 authorization server (PKCE, dynamic client registration, RFC 8414/9728 metadata) — a much larger undertaking that isn't planned for now.
