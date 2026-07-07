import { Edit, Package, Plus, Search, Trash2, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { forwardRef, useImperativeHandle, useState } from "react"

import { InventoryDeleteDialog } from "./inventory-delete"
import { InventoryUpsert } from "./inventory-upsert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { currencies } from "@/lib/constants/currencies"
import type React from "react"
import { useCompany } from "@/hooks/queries"
import { useTranslation } from "react-i18next"
import type { InventoryItem } from "@/types"

interface InventoryListProps {
  items: InventoryItem[]
  loading: boolean
  title?: string
  description?: string
  searchTerm?: string
  onSearchChange?: (value: string) => void
  emptyState: React.ReactNode
  showCreateButton?: boolean
}

export interface InventoryListHandle {
  handleAddClick: () => void
}

export const InventoryList = forwardRef<InventoryListHandle, InventoryListProps>(
  ({ items = [], loading, title, description, searchTerm, onSearchChange, emptyState, showCreateButton = false }, ref) => {
    const { t } = useTranslation()
    const { data: company } = useCompany()
    const currencySymbol = company?.currency ? currencies[company.currency]?.symbol : ""
    const [createDialog, setCreateDialog] = useState<boolean>(false)
    const [editDialog, setEditDialog] = useState<InventoryItem | null>(null)
    const [deleteDialog, setDeleteDialog] = useState<InventoryItem | null>(null)

    useImperativeHandle(ref, () => ({
      handleAddClick() {
        setCreateDialog(true)
      },
    }))

    const getStockStatus = (item: InventoryItem) => {
      if (item.quantity <= 0) {
        return { label: t("inventory.stock.outOfStock"), variant: "destructive" as const }
      }
      if (item.quantity <= item.minQuantity) {
        return { label: t("inventory.stock.lowStock"), variant: "warning" as const }
      }
      return { label: t("inventory.stock.inStock"), variant: "success" as const }
    }

    return (
      <>
        <Card className="gap-0">
          <CardHeader className="border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
            {title ? (
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <span>{title}</span>
                </CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </div>
            ) : onSearchChange ? (
              <div className="relative w-full sm:w-fit sm:flex-1 sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("inventory.search.placeholder") || ""}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            ) : null}
            <div className="flex items-center gap-2 sm:ml-auto">
              {showCreateButton && (
                <Button onClick={() => setCreateDialog(true)} dataCy="inventory-add-button">
                  <Plus className="h-4 w-4 mr-0 md:mr-2" />
                  <span className="hidden md:inline-flex">{t("inventory.list.add")}</span>
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
              </div>
            ) : items.length === 0 ? (
              emptyState
            ) : (
              <div className="divide-y">
                {items.map((item) => {
                  const stockStatus = getStockStatus(item)
                  return (
                    <div key={item.id} className="p-4 sm:p-6" data-cy="inventory-item">
                      <div className="flex flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-row items-center gap-4 w-full">
                          <div className="p-2 bg-green-100 rounded-lg mb-4 md:mb-0 w-fit h-fit">
                            <Package className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium text-foreground break-words">{item.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {stockStatus.label}
                              </Badge>
                              {item.sku && (
                                <Badge variant="secondary" className="text-xs">
                                  SKU: {item.sku}
                                </Badge>
                              )}
                            </div>
                            {item.description && (
                              <div className="mt-1 text-sm text-muted-foreground break-words">{item.description}</div>
                            )}
                            <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                              <span>{t("inventory.fields.quantity.label")}: {item.quantity}</span>
                              <span>{t("inventory.fields.unitPrice.label")}: {item.unitPrice}{currencySymbol}</span>
                              {item.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:flex justify-start sm:justify-end gap-1 md:gap-2">
                          <Button tooltip={t("inventory.actions.edit")} variant="ghost" size="icon" onClick={() => setEditDialog(item)} className="text-gray-600 hover:text-green-600" dataCy="inventory-edit-button">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button tooltip={t("inventory.actions.delete")} variant="ghost" size="icon" onClick={() => setDeleteDialog(item)} className="text-gray-600 hover:text-red-600" dataCy="inventory-delete-button">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <InventoryUpsert open={createDialog} onOpenChange={(open: boolean) => setCreateDialog(open)} />
        <InventoryUpsert open={!!editDialog} item={editDialog} onOpenChange={(open: boolean) => { if (!open) setEditDialog(null) }} />
        <InventoryDeleteDialog item={deleteDialog} onOpenChange={(open: boolean) => { if (!open) setDeleteDialog(null) }} />
      </>
    )
  },
)
