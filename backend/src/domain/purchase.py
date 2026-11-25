from dataclasses import dataclass
from decimal import Decimal

from src.domain.errors import DomainError


@dataclass(frozen=True)
class RequestedItem:
    product_id: int
    quantity: int


@dataclass(frozen=True)
class StockItem:
    product_id: int
    sku: str
    name: str
    price: Decimal
    stock: int


@dataclass(frozen=True)
class AllocatedItem:
    product_id: int
    sku: str
    name: str
    quantity: int
    unit_price: Decimal


@dataclass(frozen=True)
class PurchasePlan:
    items: list[AllocatedItem]
    total: Decimal


def plan_purchase(requested: list[RequestedItem], stock: list[StockItem]) -> PurchasePlan:
    if not requested:
        raise DomainError("At least one item is required.")
    merged: dict[int, int] = {}
    for item in requested:
        if item.quantity < 1:
            raise DomainError(
                "Quantity must be at least 1.",
                details=[{"product_id": item.product_id, "quantity": item.quantity}],
            )
        merged[item.product_id] = merged.get(item.product_id, 0) + item.quantity
    available = {item.product_id: item for item in stock}
    missing = []
    shortages = []
    allocated: list[AllocatedItem] = []
    for product_id in sorted(merged):
        quantity = merged[product_id]
        product = available.get(product_id)
        if product is None:
            missing.append({"product_id": product_id})
            continue
        if product.stock < quantity:
            shortages.append(
                {
                    "product_id": product_id,
                    "sku": product.sku,
                    "requested": quantity,
                    "available": product.stock,
                }
            )
            continue
        allocated.append(
            AllocatedItem(
                product_id=product.product_id,
                sku=product.sku,
                name=product.name,
                quantity=quantity,
                unit_price=product.price,
            )
        )
    if missing:
        raise DomainError("Product not found.", status_code=404, details=missing)
    if shortages:
        raise DomainError("Insufficient stock.", status_code=409, details=shortages)
    total = sum((item.unit_price * item.quantity for item in allocated), Decimal("0.00")).quantize(Decimal("0.01"))
    return PurchasePlan(allocated, total)
