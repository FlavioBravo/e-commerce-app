from decimal import Decimal

from src.database.entities import Order, Product
from src.shared.serializers import BaseSchema, Money, Weight


class ProductResponse(BaseSchema):
    id: int
    sku: str
    name: str
    description: str
    category: str
    price: Money
    stock: int
    weight_kg: Weight


class ProductListResponse(BaseSchema):
    items: list[ProductResponse]
    page: int
    page_size: int
    total: int


class DeleteProductResponse(BaseSchema):
    id: int
    deleted: bool


class ImportRowResponse(BaseSchema):
    line: int
    sku: str | None = None
    name: str | None = None
    status: str
    messages: list[str]


class ImportProductsResponse(BaseSchema):
    created: int
    updated: int
    rejected: int
    skipped: int
    superseded: int
    rows: list[ImportRowResponse]


class OrderItemResponse(BaseSchema):
    product_id: int
    sku: str
    name: str
    quantity: int
    unit_price: Money
    line_total: Money


class OrderResponse(BaseSchema):
    id: int
    status: str
    total: Money
    payment_reference: str
    items: list[OrderItemResponse]


class CategoryResponse(BaseSchema):
    id: int
    name: str


def to_product_response(product: Product) -> ProductResponse:
    return ProductResponse(
        id=product.id,
        sku=product.sku,
        name=product.name,
        description=product.description,
        category=product.category.name,
        price=product.price,
        stock=product.stock,
        weight_kg=product.weight_kg,
    )


def to_order_response(order: Order) -> OrderResponse:
    items = []
    for item in order.items:
        line_total = (item.unit_price * item.quantity).quantize(Decimal("0.01"))
        items.append(
            OrderItemResponse(
                product_id=item.product_id,
                sku=item.product.sku,
                name=item.product.name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=line_total,
            )
        )
    return OrderResponse(
        id=order.id,
        status=order.status,
        total=order.total,
        payment_reference=order.payment_reference,
        items=items,
    )
