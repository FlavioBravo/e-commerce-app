from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.persistency import get_session
from src.use_cases.catalog import CategoryResponse
from src.use_cases.categories import list_categories as category_queries

category_router = APIRouter(prefix="/categories", tags=["categories"])


@category_router.get("/", response_model=list[CategoryResponse])
async def list_categories(session: AsyncSession = Depends(get_session)) -> list[CategoryResponse]:
    return await category_queries.list_categories(session)
