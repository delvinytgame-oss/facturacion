import { format } from "date-fns"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Plus, AlertTriangle, RefreshCw } from "lucide-react"
import { CrmImportDialog } from "@/pages/(app)/inventory/_components/crm-import-dialog"
import { InventoryDeleteDialog } from "@/pages/(app)/inventory/_components/inventory-delete"
import { InventoryTable } from "@/pages/(app)/inventory/_components/inventory-table"
import { InventoryUpsert } from "@/pages/(app)/inventory/_components/inventory-upsert"
import { StockMovementDialog } from "@/pages/(app)/inventory/_components/stock-movement-dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { InventoryItem } from "@/types"
import { currencies } from "@/lib/constants/currencies"
import { useCompany, useInventory, useLowStockItems, useInventoryCategories, useInventoryLocations } from "@/hooks/queries"
import { usePageHeader } from "@/hooks/use-page-header"
import { useTranslation } from "react-i18next"

function csvEscape(value: string) {
    if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`
    }
    return value
}

export default function InventoryPage() {
    const { t } = useTranslation()
    const { data: inventory } = useInventory()
    const { data: lowStockData } = useLowStockItems()
    const { data: categoriesData } = useInventoryCategories()
    const { data: locationsData } = useInventoryLocations()
    const { data: company } = useCompany()
    const currencySymbol = company?.currency ? currencies[company.currency]?.symbol : ""

    const lowStockItems = useMemo(() => Array.isArray(lowStockData) ? lowStockData : [], [lowStockData])
    const categories = useMemo(() => Array.isArray(categoriesData) ? categoriesData : [], [categoriesData])
    const locations = useMemo(() => Array.isArray(locationsData) ? locationsData : [], [locationsData])

    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [locationFilter, setLocationFilter] = useState<string>("all")
    const [stockFilter, setStockFilter] = useState<string>("all")

    const [upsertTarget, setUpsertTarget] = useState<InventoryItem | null>(null)
    const [upsertOpen, setUpsertOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null)
    const [movementItem, setMovementItem] = useState<InventoryItem | null>(null)
    const [crmImportOpen, setCrmImportOpen] = useState(false)

    usePageHeader(t("sidebar.navigation.inventory"))

    const filtered = useMemo(() => {
        const items = Array.isArray(inventory) ? inventory : []
        return items.filter((item) => {
            const matchesSearch =
                (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.sku || "").toLowerCase().includes(searchTerm.toLowerCase())

            const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
            const matchesLocation = locationFilter === "all" || item.location === locationFilter

            let matchesStock = true
            if (stockFilter === "out_of_stock") matchesStock = item.quantity === 0
            else if (stockFilter === "low_stock") matchesStock = item.quantity > 0 && item.quantity <= item.minQuantity
            else if (stockFilter === "in_stock") matchesStock = item.quantity > item.minQuantity

            return matchesSearch && matchesCategory && matchesLocation && matchesStock
        })
    }, [inventory, searchTerm, categoryFilter, locationFilter, stockFilter])

    const handleAdd = () => {
        setUpsertTarget(null)
        setUpsertOpen(true)
    }

    const handleEdit = (item: InventoryItem) => {
        setUpsertTarget(item)
        setUpsertOpen(true)
    }

    const handleExport = () => {
        const header = [
            t("inventory.table.columns.name"),
            t("inventory.table.columns.sku"),
            t("inventory.table.columns.category"),
            t("inventory.table.columns.quantity"),
            t("inventory.table.columns.minQuantity"),
            t("inventory.table.columns.unitPrice"),
            t("inventory.table.columns.costPrice"),
            t("inventory.table.columns.location"),
        ]

        const lines = filtered.map((item) => [
            item.name,
            item.sku || "",
            item.category || "",
            String(item.quantity),
            String(item.minQuantity),
            `${item.unitPrice.toFixed(2)} ${currencySymbol}`,
            `${item.costPrice.toFixed(2)} ${currencySymbol}`,
            item.location || "",
        ])

        const csv = [header, ...lines]
            .map((line) => line.map((cell) => csvEscape(String(cell))).join(","))
            .join("\n")

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `inventory-${format(new Date(), "yyyy-MM-dd")}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            {/* Low stock alert */}
            {lowStockItems.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {t("inventory.stock.lowStockAlert", { count: lowStockItems.length })}
                    </p>
                    <Badge className="ml-auto bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">{lowStockItems.length}</Badge>
                </div>
            )}

            {/* Filters + Actions */}
            <div className="flex flex-wrap items-center gap-3">
                <Input
                    className="max-w-xs"
                    placeholder={t("inventory.search.placeholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-cy="inventory-search"
                />

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder={t("inventory.filters.allCategories")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("inventory.filters.allCategories")}</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder={t("inventory.filters.allLocations")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("inventory.filters.allLocations")}</SelectItem>
                        {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="w-36">
                        <SelectValue placeholder={t("inventory.filters.allStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("inventory.filters.allStatus")}</SelectItem>
                        <SelectItem value="in_stock">{t("inventory.filters.inStock")}</SelectItem>
                        <SelectItem value="low_stock">{t("inventory.filters.lowStock")}</SelectItem>
                        <SelectItem value="out_of_stock">{t("inventory.filters.outOfStock")}</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCrmImportOpen(true)}
                        dataCy="inventory-crm-import"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t("inventory.actions.crmImport")}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleExport}
                        disabled={filtered.length === 0}
                        dataCy="inventory-export"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        {t("inventory.actions.export")}
                    </Button>
                    <Button onClick={handleAdd} dataCy="inventory-add-button">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("inventory.list.add")}
                    </Button>
                </div>
            </div>

            {/* Table */}
            <InventoryTable
                items={filtered}
                currencySymbol={currencySymbol}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
                onMovements={setMovementItem}
            />

            {/* Dialogs */}
            <InventoryUpsert open={upsertOpen} item={upsertTarget} onOpenChange={(open: boolean) => { if (!open) setUpsertTarget(null); setUpsertOpen(open) }} />
            <InventoryDeleteDialog item={deleteTarget} onOpenChange={(open: boolean) => { if (!open) setDeleteTarget(null) }} />
            <StockMovementDialog item={movementItem} open={!!movementItem} onOpenChange={(open: boolean) => { if (!open) setMovementItem(null) }} />
            <CrmImportDialog open={crmImportOpen} onOpenChange={setCrmImportOpen} />
        </div>
    )
}
