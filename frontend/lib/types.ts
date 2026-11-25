export type Product = {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stock: number;
  weightKg: string;
};

export type ProductList = {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
};

export type Category = {
  id: number;
  name: string;
};

export type ImportRow = {
  line: number;
  sku: string | null;
  name: string | null;
  status: string;
  messages: string[];
};

export type ImportReport = {
  created: number;
  updated: number;
  rejected: number;
  skipped: number;
  superseded: number;
  rows: ImportRow[];
};

export type OrderItem = {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type Order = {
  id: number;
  status: string;
  total: string;
  paymentReference: string;
  items: OrderItem[];
};

export type FieldDetail = {
  field?: string;
  message?: string;
  sku?: string;
  requested?: number;
  available?: number;
  productId?: number;
};
