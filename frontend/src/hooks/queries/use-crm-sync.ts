import { useApiMutation, useApiQuery } from "@/hooks/use-api-query"
import { queryKeys } from "@/lib/query-keys"

export interface CrmProduct {
    id: string
    name: string
    description?: string
    sku?: string
    price: number
    cost?: number
    stock: number
    min_stock?: number
    category?: string
    status: string
    brand?: string
    model?: string
    product_type?: string
}

export interface CrmAccount {
    id: string
    name: string
}

export function useCrmAccounts() {
    return useApiQuery<CrmAccount[]>(
        queryKeys.crm.accounts(),
        "/api/crm-sync/accounts",
    )
}

export function useCrmProducts(accountId: string, search?: string) {
    const url = search
        ? `/api/crm-sync/products?accountId=${accountId}&search=${encodeURIComponent(search)}`
        : `/api/crm-sync/products?accountId=${accountId}`
    return useApiQuery<CrmProduct[]>(
        queryKeys.crm.products(accountId),
        url,
        { enabled: !!accountId },
    )
}

export interface ImportProductsInput {
    productIds: string[]
    accountId: string
}

export function useImportCrmProducts() {
    return useApiMutation<ImportProductsInput, { imported: number; skipped: number }>(
        "POST",
        "/api/crm-sync/import",
        { invalidateKeys: [queryKeys.inventory.list()] },
    )
}

export function useSyncStockFromCrm() {
    return useApiMutation<{ accountId: string }, { updated: number }>(
        "POST",
        "/api/crm-sync/sync-stock",
        { invalidateKeys: [queryKeys.inventory.list()] },
    )
}

export interface DeductStockItem {
    productId: string
    quantity: number
}

export function useDeductCrmStock() {
    return useApiMutation<{ items: DeductStockItem[] }, void>(
        "POST",
        "/api/crm-sync/deduct-stock",
    )
}
