from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.entities import Category


async def list_categories(session: AsyncSession) -> list[Category]:
    result = await session.execute(select(Category).order_by(Category.name))
    return list(result.scalars().all())


async def get_category_by_name(session: AsyncSession, name: str) -> Category | None:
    result = await session.execute(select(Category).where(Category.name == name))
    return result.scalars().first()


async def get_or_create_category(session: AsyncSession, name: str) -> Category:
    category = await get_category_by_name(session, name)
    if category is not None:
        return category
    category = Category(name=name)
    session.add(category)
    await session.flush()
    return category
