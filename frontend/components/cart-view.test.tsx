import { fireEvent, render, screen } from "@testing-library/react";

import { CartView } from "@/components/cart-view";
import { I18nProvider } from "@/components/i18n-provider";
import en from "@/dictionaries/en";
import { useCartStore } from "@/lib/cart-store";

jest.mock("@/components/providers", () => ({
  useCartReady: () => true,
}));

function renderCart() {
  return render(
    <I18nProvider locale="en" dictionary={en}>
      <CartView />
    </I18nProvider>,
  );
}

describe("CartView", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("shows an empty cart", () => {
    renderCart();
    expect(screen.getByText("The cart is empty.")).toBeInTheDocument();
  });

  it("updates the quantity and removes a line", () => {
    useCartStore.setState({
      items: [
        {
          productId: 1,
          sku: "LAMP-1",
          name: "Desk lamp",
          unitPrice: "10.00",
          stock: 5,
          quantity: 1,
        },
      ],
    });
    renderCart();

    expect(screen.getAllByText("$10.00")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
    expect(screen.getAllByText("$20.00")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByText("The cart is empty.")).toBeInTheDocument();
  });
});
