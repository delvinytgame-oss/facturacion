-- AlterTable: new scopes column, defaulted to empty array so this applies
-- cleanly to existing rows. Existing keys predate the scopes concept and
-- were minted under the old all-or-nothing company-ADMIN model; they are
-- backfilled to full access in the migration that follows so no live
-- integration silently loses capability on deploy. New keys created after
-- this migration default to an empty scope set (see api-keys.service.ts) —
-- the actual security improvement is that granting scope becomes a
-- deliberate choice going forward, not a retroactive revocation now.
ALTER TABLE "api_key" ADD COLUMN     "scopes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
