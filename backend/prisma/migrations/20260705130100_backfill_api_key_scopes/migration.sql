-- Backfill: grant every existing API key every scope that exists as of
-- this migration, since they were all created before the scopes concept
-- existed and were implicitly full-access. Keys created after this
-- migration start from an empty scope set instead (app-level default in
-- api-keys.service.ts#create), so this backfill is a one-time compatibility
-- step, not the ongoing default.
UPDATE "api_key" SET "scopes" = ARRAY[
  'quotes:write', 'invoices:write', 'clients:write', 'articles:write', 'articles:read'
]::TEXT[] WHERE "scopes" = ARRAY[]::TEXT[];
