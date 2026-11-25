from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.database.entities import Order, OrderItem


def add_order(session: AsyncSession, order: Order) -> None:
    session.add(order)


async def get_order(session: AsyncSession, order_id: int) -> Order | None:
    statement = select(Order).where(Order.id == order_id).options(selectinload(Order.items).selectinload(OrderItem.product))
    result = await session.execute(statement)
    return result.scalars().first()


async def count_orders_by_product(session: AsyncSession, product_id: int) -> int:
    statement = select(func.count()).select_from(OrderItem).where(OrderItem.product_id == product_id)
    return (await session.execute(statement)).scalar_one()
