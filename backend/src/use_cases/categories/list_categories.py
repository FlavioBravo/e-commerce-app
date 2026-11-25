from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.persistency import categories as category_store
from src.use_cases.catalog import CategoryResponse


async def list_categories(session: AsyncSession) -> list[CategoryResponse]:
    categories = await category_store.list_categories(session)
    return [CategoryResponse(id=category.id, name=category.name) for category in categories]
