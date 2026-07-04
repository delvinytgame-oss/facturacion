import { useApiQuery } from "@/hooks/use-api-query"
import { queryKeys } from "@/lib/query-keys"
import type { Expense } from "@/types"

export function useExpenses() {
    return useApiQuery<Expense[]>(
        queryKeys.expenses.list(),
        "/api/expenses",
    )
}
