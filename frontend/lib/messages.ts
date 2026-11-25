import { type Locale } from "@/lib/locale";

const spanish: Record<string, string> = {
  "Product not found.": "Producto no encontrado.",
  "SKU already exists.": "El SKU ya existe.",
  "Invalid product.": "Producto inválido.",
  "Product cannot be deleted because it belongs to an order.": "No se puede eliminar el producto porque pertenece a un pedido.",
  "At least one item is required.": "Se necesita al menos un producto.",
  "Quantity must be at least 1.": "La cantidad debe ser al menos 1.",
  "Insufficient stock.": "Stock insuficiente.",
  "Order not found.": "Pedido no encontrado.",
  "Page must be at least 1 and page size must be between 1 and 100.": "La página debe ser al menos 1 y el tamaño entre 1 y 100.",
  "CSV file is empty.": "El archivo CSV está vacío.",
  "CSV header is missing.": "Falta el encabezado del CSV.",
  "CSV header contains an empty column.": "El encabezado del CSV tiene una columna vacía.",
  "CSV header contains duplicate columns.": "El encabezado del CSV tiene columnas repetidas.",
  "CSV file is too large.": "El archivo CSV es demasiado grande.",
  "CSV file must be UTF-8.": "El archivo CSV debe ser UTF-8.",
  "The catalog could not be saved because a unique value already exists.":
    "No se pudo guardar el catálogo porque un valor único ya existe.",
  "SKU is required.": "El SKU es obligatorio.",
  "SKU must contain only letters, numbers, and hyphens.": "El SKU solo puede tener letras, números y guiones.",
  "Price cannot be negative.": "El precio no puede ser negativo.",
  "Price cannot have more than 2 decimal places.": "El precio no puede tener más de 2 decimales.",
  "Weight cannot be negative.": "El peso no puede ser negativo.",
  "Weight cannot have more than 3 decimal places.": "El peso no puede tener más de 3 decimales.",
  "Stock is required.": "El stock es obligatorio.",
  "Stock must be an integer.": "El stock debe ser un número entero.",
  "Stock cannot be negative.": "El stock no puede ser negativo.",
  "Name is required.": "El nombre es obligatorio.",
  "Description is required.": "La descripción es obligatoria.",
  "Category is required.": "La categoría es obligatoria.",
  "Price is required.": "El precio es obligatorio.",
  "Weight is required.": "El peso es obligatorio.",
  "Name must be 200 characters or fewer.": "El nombre no puede pasar de 200 caracteres.",
  "Description must be 4000 characters or fewer.": "La descripción no puede pasar de 4000 caracteres.",
  "Category must be 80 characters or fewer.": "La categoría no puede pasar de 80 caracteres.",
  "Price must be a decimal number.": "El precio debe ser un número decimal.",
  "Weight must be a decimal number.": "El peso debe ser un número decimal.",
  "A later row with the same SKU replaced this one.": "Una fila posterior con el mismo SKU reemplazó esta.",
  "The request failed.": "La solicitud falló.",
  "The payment could not be completed.": "No se pudo completar el pago.",
  "The product could not be saved.": "No se pudo guardar el producto.",
};

/** Translates a known API message. English is returned unchanged, and an unknown Spanish message stays in English. */
export function translateApiMessage(locale: Locale, message: string): string {
  if (locale === "en") return message;
  const known = spanish[message];
  if (known) return known;
  const missing = /^CSV is missing columns: (.+)\.$/.exec(message);
  if (missing) return `Al CSV le faltan columnas: ${missing[1]}.`;
  return message;
}
