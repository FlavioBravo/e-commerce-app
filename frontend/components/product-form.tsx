"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { createProduct, updateProduct, type ProductInput } from "@/lib/browser-api";
import { ApiError } from "@/lib/errors";
import { translateApiMessage } from "@/lib/messages";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import { productInputSchema, validationError } from "@/lib/schemas";
import type { Category, Product } from "@/lib/types";

type Props = {
  categories: Category[];
  product?: Product;
};

export function ProductForm({ categories, product }: Props) {
  const { locale, dictionary, href } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<ApiError | null>(null);
  const copy = dictionary.form;
  const mutation = useMutation({
    mutationFn: (input: ProductInput) => (product ? updateProduct(product.id, input) : createProduct(input)),
    onSuccess: (saved) => {
      const skus = product && product.sku !== saved.sku ? [saved.sku, product.sku] : [saved.sku];
      void revalidateCatalog(skus);
      router.push(href("/admin/products"));
      router.refresh();
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason : new ApiError(copy.saveFailed)),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = productInputSchema.safeParse({
      name: String(form.get("name") ?? ""),
      sku: String(form.get("sku") ?? ""),
      description: String(form.get("description") ?? ""),
      category: String(form.get("category") ?? ""),
      price: String(form.get("price") ?? ""),
      stock: String(form.get("stock") ?? ""),
      weightKg: String(form.get("weightKg") ?? ""),
    });
    if (!parsed.success) {
      setError(validationError("Invalid product.", parsed.error));
      return;
    }
    setError(null);
    mutation.mutate(parsed.data);
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-4">
      <Field label={copy.name} name="name" defaultValue={product?.name} required />
      <Field label={copy.sku} name="sku" defaultValue={product?.sku} required />
      <label className="grid gap-1 text-sm">
        {copy.description}
        <textarea name="description" required defaultValue={product?.description} rows={4} className="rounded-xl border border-line px-3 py-2 outline-none" />
      </label>
      <label className="grid gap-1 text-sm">
        {copy.category}
        <input name="category" required defaultValue={product?.category} list="categories" className="rounded-xl border border-line px-3 py-2 outline-none" />
        <datalist id="categories">
          {categories.map((category) => (
            <option key={category.id} value={category.name} />
          ))}
        </datalist>
      </label>
      <Field label={copy.price} name="price" defaultValue={product?.price ?? "0.00"} required />
      <Field label={copy.stock} name="stock" defaultValue={product ? String(product.stock) : "0"} required type="number" />
      <Field label={copy.weight} name="weightKg" defaultValue={product?.weightKg ?? "0"} required />
      {error ? (
        <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p>{translateApiMessage(locale, error.message)}</p>
          {error.details.length > 0 ? (
            <ul className="mt-1 list-disc pl-4">
              {error.details.map((detail, index) => (
                <li key={index}>{translateApiMessage(locale, String(detail.message ?? detail.field ?? ""))}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <button type="submit" disabled={mutation.isPending} className="w-fit rounded-lg bg-rausch px-5 py-3 text-sm font-semibold text-white hover:bg-[#e31c5f] disabled:opacity-60">
        {mutation.isPending ? copy.saving : copy.save}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input name={name} type={type} required={required} defaultValue={defaultValue} className="rounded-xl border border-line px-3 py-2 outline-none" />
    </label>
  );
}
