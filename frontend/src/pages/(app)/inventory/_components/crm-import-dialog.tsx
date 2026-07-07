"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useCrmAccounts, useCrmProducts, useImportCrmProducts } from "@/hooks/queries"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { useTranslation } from "react-i18next"
import { Search, Loader2, Check } from "lucide-react"

interface CrmImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CrmImportDialog({ open, onOpenChange }: CrmImportDialogProps) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { data: accounts = [] } = useCrmAccounts()
    const [selectedAccount, setSelectedAccount] = useState<string>("")
    const [search, setSearch] = useState("")
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const { data: products = [], isLoading } = useCrmProducts(selectedAccount, search)
    const importMutation = useImportCrmProducts()

    const handleToggle = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        )
    }

    const handleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(products.map((p) => p.id))
        }
    }

    const handleImport = async () => {
        if (!selectedAccount || selectedIds.length === 0) return

        try {
            const result = await importMutation.mutateAsync({
                productIds: selectedIds,
                accountId: selectedAccount,
            })
            toast.success(`${result.imported} products imported, ${result.skipped} skipped`)
            queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() })
            setSelectedIds([])
            onOpenChange(false)
        } catch {
            toast.error("Failed to import products")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("inventory.crmImport.title")}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Account selector */}
                    <div className="flex items-center gap-3">
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder={t("inventory.crmImport.selectAccount")} />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {selectedAccount && (
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder={t("inventory.crmImport.searchProducts")}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        )}
                    </div>

                    {/* Products table */}
                    {!selectedAccount ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            {t("inventory.crmImport.selectAccountFirst")}
                        </p>
                    ) : isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : products.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            {t("inventory.crmImport.noProducts")}
                        </p>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    {selectedIds.length} / {products.length} {t("inventory.crmImport.selected")}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                >
                                    {selectedIds.length === products.length ? t("inventory.crmImport.deselectAll") : t("inventory.crmImport.selectAll")}
                                </Button>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10"></TableHead>
                                        <TableHead>{t("inventory.crmImport.columns.name")}</TableHead>
                                        <TableHead>{t("inventory.crmImport.columns.sku")}</TableHead>
                                        <TableHead>{t("inventory.crmImport.columns.category")}</TableHead>
                                        <TableHead className="text-right">{t("inventory.crmImport.columns.stock")}</TableHead>
                                        <TableHead className="text-right">{t("inventory.crmImport.columns.price")}</TableHead>
                                        <TableHead>{t("inventory.crmImport.columns.status")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant={selectedIds.includes(product.id) ? "default" : "outline"}
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleToggle(product.id)}
                                                >
                                                    {selectedIds.includes(product.id) && <Check className="h-3 w-3" />}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {product.sku || "-"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {product.category || "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">{product.stock}</TableCell>
                                            <TableCell className="text-right">{product.price}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-xs">
                                                    {product.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}

                    {/* Import button */}
                    {selectedIds.length > 0 && (
                        <div className="flex justify-end">
                            <Button onClick={handleImport} disabled={importMutation.isPending}>
                                {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {t("inventory.crmImport.import")} ({selectedIds.length})
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
