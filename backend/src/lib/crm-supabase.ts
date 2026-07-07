import { createClient, SupabaseClient } from '@supabase/supabase-js';

let crmClient: SupabaseClient | null = null;

export function getCrmSupabaseClient(): SupabaseClient | null {
  const url = process.env.CRM_SUPABASE_URL;
  const key = process.env.CRM_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!crmClient) {
    crmClient = createClient(url, key);
  }

  return crmClient;
}

export interface CrmProduct {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  cost?: number;
  stock: number;
  min_stock?: number;
  category?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  brand?: string;
  model?: string;
  product_type?: string;
  itbis?: boolean;
  created_at: string;
  updated_at: string;
}
