import { browserApiUrl } from "@/lib/config";
import { ApiError } from "@/lib/errors";
import type { ProductInput } from "@/lib/schemas";
import type { ImportReport, Order, Product } from "@/lib/types";

export type { ProductInput };

/** Sends a browser request to the public API and throws `ApiError` when the response is not ok. */
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

/** Creates a product from a validated catalog payload. */
export function createProduct(input: ProductInput) {
  return request<Product>("/products/", { method: "POST", body: JSON.stringify(input) });
}

/** Replaces the product `id` with a validated catalog payload. */
export function updateProduct(id: number, input: ProductInput) {
  return request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

/** Deletes a product that is not already part of an order. */
export function deleteProduct(id: number) {
  return request<{ id: number; deleted: boolean }>(`/products/${id}`, { method: "DELETE" });
}

/** Uploads a CSV catalog. Valid rows are saved and invalid rows come back in the report. */
export function importCatalog(file: File) {
  const body = new FormData();
  body.set("file", file);
  return request<ImportReport>("/products/import", { method: "POST", body });
}

/** Places an order with product ids and quantities. The server recalculates price and stock. */
export function placeOrder(items: Array<{ productId: number; quantity: number }>) {
  return request<Order>("/orders/", { method: "POST", body: JSON.stringify({ items }) });
}
