import { render, screen } from "@testing-library/react";

import ProductsPage from "@/app/[locale]/products/page";
import { getCategories, getProducts } from "@/lib/api";
import type { Product } from "@/lib/types";

jest.mock("@/lib/api", () => ({
  getProducts: jest.fn(),
  getCategories: jest.fn(),
}));

const lamp: Product = {
  id: 1,
  sku: "LAMP-1",
  name: "Desk lamp",
  description: "A lamp",
  category: "Tools",
  price: "10.00",
  stock: 4,
  weightKg: "1.250",
};

describe("ProductsPage", () => {
  beforeEach(() => {
    jest.mocked(getCategories).mockResolvedValue([{ id: 1, name: "Tools" }]);
  });

  it("lists products and ignores an invalid page", async () => {
    jest.mocked(getProducts).mockResolvedValue({ items: [lamp], page: 1, pageSize: 12, total: 1 });
    const view = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ q: "  saw  ", category: " ", page: "nope" }),
    });
    render(view);

    expect(getProducts).toHaveBeenCalledWith({ q: "saw", category: undefined, page: 1, pageSize: 12 });
    expect(screen.getByRole("heading", { name: "Desk lamp" })).toBeInTheDocument();
    expect(screen.getByText("4 available")).toBeInTheDocument();
  });

  it("shows the empty catalog", async () => {
    jest.mocked(getProducts).mockResolvedValue({ items: [], page: 1, pageSize: 12, total: 0 });
    const view = await ProductsPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    render(view);
    expect(screen.getByText("No products match that search.")).toBeInTheDocument();
  });
});
