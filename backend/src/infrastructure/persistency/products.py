from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager, selectinload

from src.database.entities import Category, Product


async def get_product(session: AsyncSession, product_id: int) -> Product | None:
    statement = select(Product).where(Product.id == product_id).options(selectinload(Product.category))
    result = await session.execute(statement)
    return result.scalars().first()


async def get_product_by_sku(session: AsyncSession, sku: str) -> Product | None:
    statement = select(Product).where(Product.sku == sku).options(selectinload(Product.category))
    result = await session.execute(statement)
    return result.scalars().first()


async def get_products_by_skus(session: AsyncSession, skus: list[str]) -> list[Product]:
    if not skus:
        return []
    statement = select(Product).where(Product.sku.in_(skus)).options(selectinload(Product.category))
    result = await session.execute(statement)
    return list(result.scalars().all())


async def get_products_for_update(session: AsyncSession, product_ids: list[int]) -> list[Product]:
    if not product_ids:
        return []
    statement = (
        select(Product)
        .where(Product.id.in_(product_ids))
        .options(selectinload(Product.category))
        .with_for_update(of=Product)
        .order_by(Product.id)
    )
    result = await session.execute(statement)
    return list(result.scalars().all())


async def search_products(
    session: AsyncSession, q: str | None, category: str | None, page: int, page_size: int
) -> tuple[list[Product], int]:
    filters = []
    if q:
        pattern = _contains_pattern(q)
        filters.append(
            or_(
                Product.name.ilike(pattern, escape="\\"),
                Product.sku.ilike(pattern, escape="\\"),
                Product.description.ilike(pattern, escape="\\"),
            )
        )
    if category:
        filters.append(Category.name.ilike(_exact_pattern(category), escape="\\"))
    count_query = select(func.count(Product.id)).select_from(Product).join(Product.category)
    list_query = select(Product).join(Product.category).options(contains_eager(Product.category)).order_by(Product.name, Product.sku)
    if filters:
        count_query = count_query.where(*filters)
        list_query = list_query.where(*filters)
    total = (await session.execute(count_query)).scalar_one()
    window = list_query.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(window)
    return list(result.scalars().unique().all()), total


def add_product(session: AsyncSession, product: Product) -> None:
    session.add(product)


async def delete_product(session: AsyncSession, product: Product) -> None:
    await session.delete(product)


def _contains_pattern(value: str) -> str:
    return f"%{_escape_like(value)}%"


def _exact_pattern(value: str) -> str:
    return _escape_like(value)


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
