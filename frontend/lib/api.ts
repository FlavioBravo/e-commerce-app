import { serverApiUrl } from "@/lib/config";
import { readApiError } from "@/lib/errors";
import type { Category, Order, Product, ProductList } from "@/lib/types";

export const CATALOG_CACHE_TAG = "catalog";

const CATALOG_REVALIDATE_SECONDS = 60;

export type ReadCache = "catalog" | "live";

function requestInit(cache: ReadCache): RequestInit {
  if (cache === "live") return { cache: "no-store" };
  return { next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_CACHE_TAG] } };
}

export async function serverGet<T>(path: string, cache: ReadCache = "catalog"): Promise<T> {
  const response = await fetch(`${serverApiUrl()}${path}`, requestInit(cache));
  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<T>;
}

async function serverGetOrNull<T>(path: string, cache: ReadCache): Promise<T | null> {
  const response = await fetch(`${serverApiUrl()}${path}`, requestInit(cache));
  if (response.status === 404) return null;
  if (!response.ok) throw await readApiError(response);
  return response.json() as Promise<T>;
}

export function productQuery(filters: { q?: string; category?: string; page?: number; pageSize?: number }): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  params.set("page", String(filters.page ?? 1));
  params.set("pageSize", String(filters.pageSize ?? 12));
  return `/products/?${params.toString()}`;
}

export function getProducts(
  filters: { q?: string; category?: string; page?: number; pageSize?: number },
  cache: ReadCache = "catalog",
) {
  return serverGet<ProductList>(productQuery(filters), cache);
}

export function getCategories(cache: ReadCache = "catalog") {
  return serverGet<Category[]>("/categories/", cache);
}

export function getProductBySku(sku: string): Promise<Product | null> {
  return serverGetOrNull<Product>(`/products/by-sku/${encodeURIComponent(sku)}`, "catalog");
}

export function getProduct(id: number): Promise<Product | null> {
  return serverGetOrNull<Product>(`/products/${id}`, "live");
}

export function getOrder(id: number): Promise<Order | null> {
  return serverGetOrNull<Order>(`/orders/${id}`, "live");
}
