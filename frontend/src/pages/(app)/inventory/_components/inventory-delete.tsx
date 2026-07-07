"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authenticatedFetch } from "@/hooks/use-fetch";
import { queryKeys } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { InventoryItem } from "@/types";

export function InventoryDeleteDialog({
  item, onOpenChange,
}: {
  item?: InventoryItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const open = !!item;

  const handleDelete = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const res = await authenticatedFetch(`${import.meta.env.VITE_BACKEND_URL || ""}/api/inventory/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
      toast.success(t("inventory.upsert.messages.deleteSuccess") || "Item deleted");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(t("inventory.upsert.messages.deleteError") || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {item?.name ? `${t("inventory.actions.delete") || "Delete"} ${item.name}` : t("inventory.actions.delete") || "Delete item"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("inventory.delete.description", { name: item?.name }) || `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{t("inventory.actions.cancel") || "Cancel"}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? t("inventory.actions.deleting") || "Deleting..." : t("inventory.actions.delete") || "Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
