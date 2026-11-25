import { render, screen } from "@testing-library/react";

import { Header } from "@/components/header";
import { I18nProvider } from "@/components/i18n-provider";
import { useCartReady } from "@/components/providers";
import en from "@/dictionaries/en";
import { useCartStore } from "@/lib/cart-store";

jest.mock("next/navigation", () => ({
  usePathname: () => "/en/products",
  useSearchParams: () => new URLSearchParams("q=saw"),
}));

jest.mock("@/components/providers", () => ({
  useCartReady: jest.fn(() => true),
}));

function renderHeader() {
  return render(
    <I18nProvider locale="en" dictionary={en}>
      <Header />
    </I18nProvider>,
  );
}

describe("Header", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    jest.mocked(useCartReady).mockReturnValue(true);
  });

  it("keeps the search when switching language", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "es" })).toHaveAttribute("href", "/es/products?q=saw");
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/en/admin/products");
  });

  it("shows the cart count after the cart is ready", () => {
    useCartStore.setState({
      items: [
        { productId: 1, sku: "LAMP-1", name: "Desk lamp", unitPrice: "10.00", stock: 5, quantity: 2 },
        { productId: 2, sku: "CUP-1", name: "Cup", unitPrice: "4.00", stock: 5, quantity: 1 },
      ],
    });
    renderHeader();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("hides the count while the cart is hydrating", () => {
    jest.mocked(useCartReady).mockReturnValue(false);
    useCartStore.setState({
      items: [{ productId: 1, sku: "LAMP-1", name: "Desk lamp", unitPrice: "10.00", stock: 5, quantity: 2 }],
    });
    renderHeader();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });
});
