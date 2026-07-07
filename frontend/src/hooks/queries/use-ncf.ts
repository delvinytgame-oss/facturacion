import { useApiMutation, useApiQuery } from "@/hooks/use-api-query"

import type { NcfAuthorization, NcfAuthorizationInput, CreateNoteInput, Invoice } from "@/types"
import { queryKeys } from "@/lib/query-keys"

export function useNcfAuthorizations() {
    return useApiQuery<NcfAuthorization[]>(
        queryKeys.ncf.list(),
        "/api/ncf",
    )
}

export function useNcfTypes() {
    return useApiQuery<Record<string, string>>(
        queryKeys.ncf.types(),
        "/api/ncf/types",
    )
}

export function useNcfRemaining(ncfType: string) {
    return useApiQuery<{ ncfType: string; remaining: number }>(
        queryKeys.ncf.remaining(ncfType),
        `/api/ncf/remaining/${ncfType}`,
        { enabled: !!ncfType },
    )
}

export function useCreateNcfAuthorization() {
    return useApiMutation<NcfAuthorizationInput, NcfAuthorization>("POST", "/api/ncf", {
        invalidateKeys: [queryKeys.ncf.list()],
    })
}

export function useUpdateNcfAuthorization() {
    return useApiMutation<Partial<NcfAuthorizationInput> & { id: string }, NcfAuthorization>(
        "PATCH",
        (variables) => `/api/ncf/${variables.id}`,
        { invalidateKeys: [queryKeys.ncf.list()] },
    )
}

export function useDeleteNcfAuthorization() {
    return useApiMutation<string, void>(
        "DELETE",
        (id) => `/api/ncf/${id}`,
        { invalidateKeys: [queryKeys.ncf.list()] },
    )
}

export function useNotes() {
    return useApiQuery<Invoice[]>(
        queryKeys.notes.list(),
        "/api/notes",
    )
}

export function useNotesForInvoice(invoiceId: string) {
    return useApiQuery<Invoice[]>(
        queryKeys.notes.forInvoice(invoiceId),
        `/api/notes/invoice/${invoiceId}`,
        { enabled: !!invoiceId },
    )
}

export function useCreateNote() {
    return useApiMutation<CreateNoteInput, Invoice>("POST", "/api/notes", {
        invalidateKeys: [queryKeys.notes.list(), queryKeys.invoices.listsAll()],
    })
}
