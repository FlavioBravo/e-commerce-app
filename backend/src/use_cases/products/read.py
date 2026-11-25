from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.errors import DomainError
from src.infrastructure.persistency import orders as order_store
from src.infrastructure.persistency import products as product_store
from src.shared.serializers import BaseSchema
from src.use_cases.catalog import DeleteProductResponse, ProductListResponse, ProductResponse, to_product_response


class ListProductRequest(BaseSchema):
    q: str | None = None
    category: str | None = None
    page: int = 1
    page_size: int = 20


class GetProductRequest(BaseSchema):
    product_id: int


class GetProductBySkuRequest(BaseSchema):
    sku: str


class DeleteProductRequest(BaseSchema):
    product_id: int


async def get_product(request: GetProductRequest, session: AsyncSession) -> ProductResponse:
    product = await product_store.get_product(session, request.product_id)
    if product is None:
        raise DomainError("Product not found.", status_code=404)
    return to_product_response(product)


async def get_product_by_sku(request: GetProductBySkuRequest, session: AsyncSession) -> ProductResponse:
    product = await product_store.get_product_by_sku(session, request.sku.strip().upper())
    if product is None:
        raise DomainError("Product not found.", status_code=404)
    return to_product_response(product)


async def list_products(request: ListProductRequest, session: AsyncSession) -> ProductListResponse:
    if request.page < 1 or request.page_size < 1 or request.page_size > 100:
        raise DomainError("Page must be at least 1 and page size must be between 1 and 100.")
    query = (request.q or "").strip() or None
    category = (request.category or "").strip() or None
    products, total = await product_store.search_products(session, query, category, request.page, request.page_size)
    return ProductListResponse(
        items=[to_product_response(product) for product in products],
        page=request.page,
        page_size=request.page_size,
        total=total,
    )


async def delete_product(request: DeleteProductRequest, session: AsyncSession) -> DeleteProductResponse:
    product = await product_store.get_product(session, request.product_id)
    if product is None:
        raise DomainError("Product not found.", status_code=404)
    sales = await order_store.count_orders_by_product(session, request.product_id)
    if sales:
        raise DomainError("Product cannot be deleted because it belongs to an order.", status_code=409)
    await product_store.delete_product(session, product)
    return DeleteProductResponse(id=request.product_id, deleted=True)
