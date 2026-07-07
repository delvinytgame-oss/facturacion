export interface NcfAuthorization {
  id: string;
  companyId: string;
  ncfType: string;
  series: string;
  sequenceFrom: number;
  sequenceTo: number;
  currentSequence: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NcfAuthorizationInput {
  ncfType: string;
  series: string;
  sequenceFrom: number;
  sequenceTo: number;
  expiresAt?: string;
}

export const NCF_TYPES: Record<string, string> = {
  '01': 'Factura Fiscal',
  '02': 'Nota de Débito',
  '03': 'Nota de Crédito',
  '04': 'Factura Consumidor Final',
  '11': 'Comprobante para Exportación',
  '12': 'Factura para Regímenes Especiales',
  '13': 'Nota de Crédito para Exportación',
  '14': 'Comprobante de Compras',
  '15': 'Régimen Especial de Leyes Especiales',
  '16': 'Gubernamental',
};

export interface CreateNoteInput {
  originalInvoiceId: string;
  noteType: 'CREDIT' | 'DEBIT';
  items: {
    originalInvoiceItemId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    type?: string;
    order?: number;
  }[];
  notes?: string;
  reason?: string;
}
