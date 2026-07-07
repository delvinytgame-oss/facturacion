"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { usePatch, usePost } from "@/hooks/use-fetch";
import { queryKeys } from "@/lib/query-keys";
import { useQueryClient } from "@tanstack/react-query";

import { BetterInput } from "@/components/better-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { currencies } from "@/lib/constants/currencies";
import { toast } from "sonner";
import { useCompany } from "@/hooks/queries";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { InventoryItem } from "@/types";

const inventorySchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  quantity: z.coerce.number().int().min(0, { message: "Quantity must be >= 0" }),
  minQuantity: z.coerce.number().int().min(0, { message: "Min quantity must be >= 0" }),
  unitPrice: z.coerce.number().min(0, { message: "Price must be >= 0" }),
  costPrice: z.coerce.number().min(0, { message: "Cost must be >= 0" }),
  location: z.string().optional(),
});

type InventoryForm = z.infer<typeof inventorySchema>;

interface InventoryUpsertProps {
  item?: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryUpsert({ item, open, onOpenChange }: InventoryUpsertProps) {
  const { t } = useTranslation();
  const isEdit = !!item;
  const queryClient = useQueryClient();
  const { data: company } = useCompany();
  const currencySymbol = company?.currency ? currencies[company.currency]?.symbol : undefined;

  const { trigger: createTrigger, loading: creating } = usePost("/api/inventory");
  const { trigger: updateTrigger, loading: updating } = usePatch(`/api/inventory/${item?.id || ""}`);

  const form = useForm<InventoryForm>({
    resolver: zodResolver(inventorySchema),
    defaultValues: { name: "", description: "", sku: "", category: "", quantity: 0, minQuantity: 0, unitPrice: 0, costPrice: 0, location: "" },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name || "",
        description: item.description || "",
        sku: item.sku || "",
        category: item.category || "",
        quantity: item.quantity ?? 0,
        minQuantity: item.minQuantity ?? 0,
        unitPrice: item.unitPrice ?? 0,
        costPrice: item.costPrice ?? 0,
        location: item.location || "",
      });
    } else {
      form.reset({ name: "", description: "", sku: "", category: "", quantity: 0, minQuantity: 0, unitPrice: 0, costPrice: 0, location: "" });
    }
  }, [item, open, form]);

  const onSubmit = async (data: InventoryForm) => {
    try {
      if (isEdit) {
        const result = await updateTrigger({ ...data });
        if (!result) throw new Error("Update failed");
        toast.success(t("inventory.upsert.messages.updateSuccess") || "Item updated");
      } else {
        const result = await createTrigger(data);
        if (!result) throw new Error("Create failed");
        toast.success(t("inventory.upsert.messages.addSuccess") || "Item added");
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.list() });
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error(
        isEdit
          ? t("inventory.upsert.messages.updateError") || "Failed to update item"
          : t("inventory.upsert.messages.addError") || "Failed to add item"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-2xl" dataCy="inventory-dialog">
        <DialogHeader>
          <DialogTitle>{t(`inventory.upsert.title.${isEdit ? "edit" : "create"}`)}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-cy="inventory-form">
            <FormField name="name" control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("inventory.fields.name.label")}</FormLabel>
                  <FormControl><Input {...field} placeholder={t("inventory.fields.name.placeholder") as string} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <FormField name="description" control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("inventory.fields.description.label")}</FormLabel>
                  <FormControl><Textarea {...field} rows={3} placeholder={t("inventory.fields.description.placeholder") as string} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField name="sku" control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.fields.sku.label")}</FormLabel>
                    <FormControl><Input {...field} placeholder={t("inventory.fields.sku.placeholder") as string} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormField name="category" control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.fields.category.label")}</FormLabel>
                    <FormControl><Input {...field} placeholder={t("inventory.fields.category.placeholder") as string} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField name="location" control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.fields.location.label")}</FormLabel>
                    <FormControl><Input {...field} placeholder={t("inventory.fields.location.placeholder") as string} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <FormField name="quantity" control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.fields.quantity.label")}</FormLabel>
                    <FormControl><Input {...field} type="number" min="0" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormField name="minQuantity" control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.fields.minQuantity.label")}</FormLabel>
                    <FormControl><Input {...field} type="number" min="0" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormField name="unitPrice" control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.fields.unitPrice.label")}</FormLabel>
                    <FormControl><BetterInput {...field} type="number" step="0.01" min="0" postAdornment={currencySymbol} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              <FormField name="costPrice" control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("inventory.fields.costPrice.label")}</FormLabel>
                    <FormControl><BetterInput {...field} type="number" step="0.01" min="0" postAdornment={currencySymbol} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>{t("inventory.actions.cancel") || "Cancel"}</Button>
              <Button type="submit" disabled={creating || updating}>{isEdit ? t("inventory.actions.save") || "Save" : t("inventory.actions.add") || "Add"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default InventoryUpsert
