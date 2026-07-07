import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { InventoryItem } from "@/types"
import { Edit, History, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface InventoryTableProps {
    items: InventoryItem[]
    currencySymbol: string
    onEdit: (item: InventoryItem) => void
    onDelete: (item: InventoryItem) => void
    onMovements: (item: InventoryItem) => void
}

function getStockStatus(item: InventoryItem, t: (key: string) => string) {
    if (item.quantity <= 0) {
        return { label: t("inventory.stock.outOfStock"), className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800" }
    }
    if (item.quantity <= item.minQuantity) {
        return { label: t("inventory.stock.lowStock"), className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800" }
    }
    return { label: t("inventory.stock.inStock"), className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800" }
}

export function InventoryTable({ items, currencySymbol, onEdit, onDelete, onMovements }: InventoryTableProps) {
    const { t } = useTranslation()

    return (
        <Card className="gap-0">
            <CardContent className="p-0">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">
                        {t("inventory.table.emptyState")}
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("inventory.table.columns.name")}</TableHead>
                                <TableHead>{t("inventory.table.columns.sku")}</TableHead>
                                <TableHead>{t("inventory.table.columns.category")}</TableHead>
                                <TableHead className="text-right">{t("inventory.table.columns.quantity")}</TableHead>
                                <TableHead className="text-right">{t("inventory.table.columns.minQuantity")}</TableHead>
                                <TableHead>{t("inventory.table.columns.status")}</TableHead>
                                <TableHead className="text-right">{t("inventory.table.columns.unitPrice")}</TableHead>
                                <TableHead>{t("inventory.table.columns.location")}</TableHead>
                                <TableHead className="text-right">{t("inventory.table.columns.actions")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => {
                                const status = getStockStatus(item, t)
                                return (
                                    <TableRow key={item.id} data-cy={`inventory-row-${item.id}`}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {item.sku ? (
                                                <Badge variant="secondary" className="text-xs">{item.sku}</Badge>
                                            ) : (
                                                <span className="text-xs">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {item.category || "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground">{item.minQuantity}</TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs ${status.className}`}>{status.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.unitPrice.toFixed(2)} {currencySymbol}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {item.location || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onMovements(item)}
                                                    tooltip={t("inventory.actions.movements")}
                                                    dataCy={`inventory-movements-${item.id}`}
                                                >
                                                    <History className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onEdit(item)}
                                                    tooltip={t("inventory.actions.edit")}
                                                    dataCy={`inventory-edit-${item.id}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onDelete(item)}
                                                    tooltip={t("inventory.actions.delete")}
                                                    dataCy={`inventory-delete-${item.id}`}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-700" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
