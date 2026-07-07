import { useApiMutation, useApiQuery } from "@/hooks/use-api-query"

import type { InventoryItem, StockMovement } from "@/types"
import { queryKeys } from "@/lib/query-keys"

export function useInventory() {
    return useApiQuery<InventoryItem[]>(
        queryKeys.inventory.list(),
        "/api/inventory",
    )
}

export function useLowStockItems() {
    return useApiQuery<InventoryItem[]>(
        queryKeys.inventory.lowStock(),
        "/api/inventory/low-stock",
    )
}

export function useInventoryCategories() {
    return useApiQuery<string[]>(
        queryKeys.inventory.categories(),
        "/api/inventory/categories",
    )
}

export function useInventoryLocations() {
    return useApiQuery<string[]>(
        queryKeys.inventory.locations(),
        "/api/inventory/locations",
    )
}

export interface InventoryItemInput {
    name: string
    description?: string
    sku?: string
    category?: string
    quantity?: number
    minQuantity?: number
    unitPrice?: number
    costPrice?: number
    location?: string
}

export function useCreateInventoryItem() {
    return useApiMutation<InventoryItemInput, InventoryItem>("POST", "/api/inventory", {
        invalidateKeys: [queryKeys.inventory.list(), queryKeys.inventory.lowStock()],
    })
}

export function useUpdateInventoryItem() {
    return useApiMutation<InventoryItemInput & { id: string }, InventoryItem>(
        "PATCH",
        (variables) => `/api/inventory/${variables.id}`,
        { invalidateKeys: [queryKeys.inventory.list(), queryKeys.inventory.lowStock()] },
    )
}

export function useDeleteInventoryItem() {
    return useApiMutation<string, void>(
        "DELETE",
        (id) => `/api/inventory/${id}`,
        { invalidateKeys: [queryKeys.inventory.list(), queryKeys.inventory.lowStock()] },
    )
}

export interface StockMovementInput {
    inventoryItemId: string
    type: "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "RETURN"
    quantity: number
    reason?: string
}

export function useStockMovements(itemId: string) {
    return useApiQuery<StockMovement[]>(
        queryKeys.inventory.movements(itemId),
        `/api/stock-movements/item/${itemId}`,
        { enabled: !!itemId },
    )
}

export function useCreateStockMovement() {
    return useApiMutation<StockMovementInput, StockMovement>("POST", "/api/stock-movements", {
        invalidateKeys: [queryKeys.inventory.list(), queryKeys.inventory.lowStock()],
    })
}
