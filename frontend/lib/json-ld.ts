export function productJsonLd(product: {
  name: string;
  sku: string;
  description: string;
  category: string;
  price: string;
  stock: number;
}): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  }).replace(/</g, "\\u003c");
}
