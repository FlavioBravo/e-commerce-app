from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.entities import Order, OrderItem
from src.domain.errors import DomainError
from src.domain.purchase import RequestedItem, StockItem, plan_purchase
from src.infrastructure.payments import Charge
from src.infrastructure.persistency import orders as order_store
from src.infrastructure.persistency import products as product_store
from src.shared.serializers import BaseSchema
from src.use_cases.catalog import OrderResponse, to_order_response


class PlaceOrderItemRequest(BaseSchema):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=1)


class PlaceOrderRequest(BaseSchema):
    items: list[PlaceOrderItemRequest] = Field(min_length=1)


class GetOrderRequest(BaseSchema):
    order_id: int


async def place_order(request: PlaceOrderRequest, session: AsyncSession, charge: Charge) -> OrderResponse:
    requested = [RequestedItem(item.product_id, item.quantity) for item in request.items]
    product_ids = sorted({item.product_id for item in requested})
    products = await product_store.get_products_for_update(session, product_ids)
    plan = plan_purchase(
        requested,
        [StockItem(product.id, product.sku, product.name, product.price, product.stock) for product in products],
    )
    reference = await charge(plan.total)
    products_by_id = {product.id: product for product in products}
    order = Order(status="paid", total=plan.total, payment_reference=reference)
    order_store.add_order(session, order)
    for item in plan.items:
        product = products_by_id[item.product_id]
        product.stock -= item.quantity
        order.items.append(
            OrderItem(product=product, product_id=product.id, quantity=item.quantity, unit_price=item.unit_price)
        )
    await session.flush()
    return to_order_response(order)


async def get_order(request: GetOrderRequest, session: AsyncSession) -> OrderResponse:
    order = await order_store.get_order(session, request.order_id)
    if order is None:
        raise DomainError("Order not found.", status_code=404)
    return to_order_response(order)
