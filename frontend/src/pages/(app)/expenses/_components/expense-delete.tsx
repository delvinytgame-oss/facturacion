"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import type { Expense } from "@/types"
import { authenticatedFetch } from "@/hooks/use-fetch"
import { queryKeys } from "@/lib/query-keys"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"

export function ExpenseDeleteDialog({
    expense,
    onOpenChange,
}: {
    expense?: Expense | null
    onOpenChange: (open: boolean) => void
}) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)
    const open = !!expense

    const handleDelete = async () => {
        if (!expense) return
        setLoading(true)
        try {
            const res = await authenticatedFetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/expenses/${expense.id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Delete failed")
            queryClient.invalidateQueries({ queryKey: queryKeys.expenses.list() })
            toast.success(t("expenses.upsert.messages.deleteSuccess"))
            onOpenChange(false)
        } catch (err) {
            console.error(err)
            toast.error(t("expenses.upsert.messages.deleteError"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{t("expenses.delete.title")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t("expenses.delete.description", { description: expense?.description })}
                    </p>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            {t("expenses.actions.cancel")}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} loading={loading} dataCy="expense-delete-confirm">
                            {t("expenses.actions.delete")}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
