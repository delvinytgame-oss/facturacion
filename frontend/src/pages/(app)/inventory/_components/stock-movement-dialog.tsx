"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCreateStockMovement, useStockMovements } from "@/hooks/queries"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { InventoryItem, StockMovementType } from "@/types"
import { queryKeys } from "@/lib/query-keys"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

interface StockMovementDialogProps {
    item: InventoryItem | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const movementSchema = z.object({
    type: z.enum(["IN", "OUT", "ADJUSTMENT", "SALE", "RETURN"]),
    quantity: z.coerce.number().int().min(1, { message: "Quantity must be >= 1" }),
    reason: z.string().optional(),
})

type MovementForm = z.infer<typeof movementSchema>

const movementTypes: StockMovementType[] = ["IN", "OUT", "ADJUSTMENT", "SALE", "RETURN"]

function getMovementBadgeClass(type: string) {
    switch (type) {
        case "IN":
        case "RETURN":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800"
        case "OUT":
        case "SALE":
            return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800"
        case "ADJUSTMENT":
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
        default:
            return ""
    }
}

export function StockMovementDialog({ item, open, onOpenChange }: StockMovementDialogProps) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { data: movements = [], isLoading } = useStockMovements(item?.id || "")
    const createMovement = useCreateStockMovement()

    const form = useForm<MovementForm>({
        resolver: zodResolver(movementSchema),
        defaultValues: { type: "IN", quantity: 1, reason: "" },
    })

    useEffect(() => {
        if (open) {
            form.reset({ type: "IN", quantity: 1, reason: "" })
        }
    }, [open, form])

    const onSubmit = async (data: MovementForm) => {
        if (!item) return
        try {
            await createMovement.mutateAsync({
                inventoryItemId: item.id,
                type: data.type,
                quantity: data.quantity,
                reason: data.reason || undefined,
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.movements(item.id) })
            toast.success(t("inventory.movements.form.messages.success"))
            form.reset({ type: "IN", quantity: 1, reason: "" })
        } catch {
            toast.error(t("inventory.movements.form.messages.error"))
        }
    }

    if (!item) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("inventory.movements.title")}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {t("inventory.movements.subtitle", {
                            name: item.name,
                            sku: item.sku || "-",
                        })}
                    </p>
                </DialogHeader>

                <div className="space-y-6">
                    {/* New movement form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3">
                            <FormField name="type" control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-36">
                                        <FormLabel>{t("inventory.movements.form.type")}</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {movementTypes.map((type) => (
                                                    <SelectItem key={type} value={type}>
                                                        {t(`inventory.movements.types.${type}`)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField name="quantity" control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-24">
                                        <FormLabel>{t("inventory.movements.form.quantity")}</FormLabel>
                                        <FormControl><Input {...field} type="number" min="1" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <FormField name="reason" control={form.control}
                                render={({ field }) => (
                                    <FormItem className="flex-1 min-w-40">
                                        <FormLabel>{t("inventory.movements.form.reason")}</FormLabel>
                                        <FormControl><Input {...field} placeholder={t("inventory.movements.form.reasonPlaceholder")} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            <Button type="submit" disabled={createMovement.isPending}>
                                {t("inventory.movements.form.submit")}
                            </Button>
                        </form>
                    </Form>

                    {/* Movements history */}
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                        </div>
                    ) : movements.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            {t("inventory.movements.empty")}
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("inventory.movements.columns.date")}</TableHead>
                                    <TableHead>{t("inventory.movements.columns.type")}</TableHead>
                                    <TableHead className="text-right">{t("inventory.movements.columns.quantity")}</TableHead>
                                    <TableHead className="text-right">{t("inventory.movements.columns.previousQty")}</TableHead>
                                    <TableHead className="text-right">{t("inventory.movements.columns.newQty")}</TableHead>
                                    <TableHead>{t("inventory.movements.columns.reason")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.map((mov) => (
                                    <TableRow key={mov.id}>
                                        <TableCell className="text-sm">
                                            {new Date(mov.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs ${getMovementBadgeClass(mov.type)}`}>
                                                {t(`inventory.movements.types.${mov.type}`)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">
                                            {mov.previousQty}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium">
                                            {mov.newQty}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {mov.reason || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
