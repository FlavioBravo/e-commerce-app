import { z } from "zod";

import { ApiError } from "@/lib/errors";

const DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/;
const INTEGER_PATTERN = /^-?\d+$/;
const SKU_PATTERN = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

/**
 * Turns a failed Zod parse into the same error shape the API returns.
 * Field messages stay in English so `translateApiMessage` can localize them.
 */
export function validationError(message: string, error: z.ZodError): ApiError {
  return new ApiError(
    message,
    error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  );
}

function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (value === "") {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `${label} is required.` });
        return;
      }
      if (value.length > maxLength) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} must be ${maxLength} characters or fewer.`,
        });
      }
    });
}

function decimalText(label: "Price" | "Weight", maxPlaces: number, stripCurrency: boolean) {
  return z
    .string()
    .trim()
    .superRefine((value, context) => {
      const text = stripCurrency && value.startsWith("$") ? value.slice(1).trim() : value;
      if (text === "") {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `${label} is required.` });
        return;
      }
      if (!DECIMAL_PATTERN.test(text)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a decimal number.` });
        return;
      }
      if (Number(text) < 0) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: `${label} cannot be negative.` });
        return;
      }
      const fraction = text.split(".")[1];
      if (fraction && fraction.length > maxPlaces) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} cannot have more than ${maxPlaces} decimal places.`,
        });
      }
    })
    .transform((value) => (stripCurrency && value.startsWith("$") ? value.slice(1).trim() : value));
}

/** Product create and update payload. Matches the catalog rules enforced by the API. */
export const productInputSchema = z.object({
  name: requiredText("Name", 200),
  sku: z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (value === "") {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "SKU is required." });
        return;
      }
      const normalized = value.toUpperCase();
      if (normalized.length > 40 || !SKU_PATTERN.test(normalized)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SKU must contain only letters, numbers, and hyphens.",
        });
      }
    })
    .transform((value) => value.toUpperCase()),
  description: requiredText("Description", 4000),
  category: requiredText("Category", 80),
  price: decimalText("Price", 2, true),
  stock: z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (value === "") {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Stock is required." });
        return;
      }
      if (!INTEGER_PATTERN.test(value)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Stock must be an integer." });
        return;
      }
      if (Number(value) < 0) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: "Stock cannot be negative." });
      }
    })
    .transform((value) => Number(value)),
  weightKg: decimalText("Weight", 3, false),
});

export type ProductInput = z.output<typeof productInputSchema>;

/** Checkout body sent to `POST /orders/`. */
export const checkoutRequestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive("Invalid product."),
        quantity: z.number().int().min(1, "Quantity must be at least 1."),
      }),
    )
    .min(1, "At least one item is required."),
});

const searchText = z
  .string()
  .optional()
  .transform((value) => {
    const text = value?.trim() ?? "";
    return text === "" ? undefined : text;
  });

const pageNumber = z
  .string()
  .optional()
  .transform((value) => {
    const parsed = Number(value ?? "1");
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.floor(parsed);
  });

const catalogSearchSchema = z.object({
  q: searchText,
  category: searchText,
  page: pageNumber,
});

const adminSearchSchema = z.object({
  q: searchText,
  page: pageNumber,
});

const resourceIdSchema = z.coerce.number().int().positive();

/** Normalizes catalog query params. A missing or invalid page becomes 1. */
export function parseCatalogSearch(query: { q?: string; category?: string; page?: string }) {
  return catalogSearchSchema.parse(query);
}

/** Normalizes the admin product list query params. */
export function parseAdminSearch(query: { q?: string; page?: string }) {
  return adminSearchSchema.parse(query);
}

/**
 * Parses a positive integer route id.
 * Returns null when the segment is missing, fractional, or not a number.
 */
export function parseResourceId(value: string): number | null {
  const parsed = resourceIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
