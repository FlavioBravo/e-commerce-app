import { checkoutRequestSchema, parseResourceId, productInputSchema } from "@/lib/schemas";

describe("schemas", () => {
  it("rejects a non numeric route id", () => {
    expect(parseResourceId("12")).toBe(12);
    expect(parseResourceId("0")).toBeNull();
    expect(parseResourceId("nope")).toBeNull();
    expect(parseResourceId("1.5")).toBeNull();
  });

  it("requires at least one checkout line", () => {
    const parsed = checkoutRequestSchema.safeParse({ items: [] });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0]?.message).toBe("At least one item is required.");
  });

  it("rejects a negative price", () => {
    const parsed = productInputSchema.safeParse({
      name: "Desk lamp",
      sku: "LAMP-1",
      description: "A lamp",
      category: "Tools",
      price: "-1.00",
      stock: "1",
      weightKg: "0.5",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues.map((issue) => issue.message)).toContain("Price cannot be negative.");
  });
});
