import { browserApiUrl } from "@/lib/config";
import { ApiError } from "@/lib/errors";
import type { ProductInput } from "@/lib/schemas";
import type { ImportReport, Order, Product } from "@/lib/types";

export type { ProductInput };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${browserApiUrl()}${path}`, { ...init, headers });
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    details?: Array<Record<string, string | number>>;
  };
  if (!response.ok) {
    throw new ApiError(body.message ?? "The request failed.", body.details);
  }
  return body as T;
}

export function createProduct(input: ProductInput) {
  return request<Product>("/products/", { method: "POST", body: JSON.stringify(input) });
}

export function updateProduct(id: number, input: ProductInput) {
  return request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteProduct(id: number) {
  return request<{ id: number; deleted: boolean }>(`/products/${id}`, { method: "DELETE" });
}

export function importCatalog(file: File) {
  const body = new FormData();
  body.set("file", file);
  return request<ImportReport>("/products/import", { method: "POST", body });
}

export function placeOrder(items: Array<{ productId: number; quantity: number }>) {
  return request<Order>("/orders/", { method: "POST", body: JSON.stringify({ items }) });
}
