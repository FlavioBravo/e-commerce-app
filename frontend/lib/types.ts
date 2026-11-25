/** Product returned by the catalog API. Money and weight stay decimal strings. */
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

/** One page of the catalog. */
export type ProductList = {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
};

/** Category name used by search and the product form. */
export type Category = {
  id: number;
  name: string;
};

/** One CSV row in an import report. */
export type ImportRow = {
  line: number;
  sku: string | null;
  name: string | null;
  status: string;
  messages: string[];
};

/** Totals and per-row results from a CSV import. */
export type ImportReport = {
  created: number;
  updated: number;
  rejected: number;
  skipped: number;
  superseded: number;
  rows: ImportRow[];
};

/** One line on a saved order. Prices are decimal strings. */
export type OrderItem = {
  productId: number;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

/** Saved order, including the simulated payment reference. */
export type Order = {
  id: number;
  status: string;
  total: string;
  paymentReference: string;
  items: OrderItem[];
};

/** Extra detail attached to an API field error. */
export type FieldDetail = {
  field?: string;
  message?: string;
  sku?: string;
  requested?: number;
  available?: number;
  productId?: number;
};
