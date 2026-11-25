import type { MetadataRoute } from "next";

const privatePaths = ["/admin", "/cart", "/checkout", "/orders"].flatMap((path) => [`/es${path}`, `/en${path}`]);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/es/products", "/en/products"],
      disallow: privatePaths,
    },
  };
}
