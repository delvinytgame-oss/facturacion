import type { Company } from "./company";

export interface InventoryItem {
  id: string;
  companyId: string;
  company?: Company;
  name: string;
  description?: string | null;
  sku?: string | null;
  category?: string | null;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  costPrice: number;
  location?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "RETURN";

export interface StockMovement {
  id: string;
  inventoryItemId: string;
  companyId: string;
  type: StockMovementType;
  quantity: number;
  previousQty: number;
  newQty: number;
  reason?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
  inventoryItem?: { name: string; sku?: string | null };
}
