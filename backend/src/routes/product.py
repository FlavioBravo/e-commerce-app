from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.errors import DomainError
from src.infrastructure.persistency import get_session
from src.use_cases.catalog import DeleteProductResponse, ImportProductsResponse, ProductListResponse, ProductResponse
from src.use_cases.products import import_products as product_import
from src.use_cases.products import read as read_products
from src.use_cases.products import write as write_products
from src.use_cases.products.import_products import ImportProductsRequest
from src.use_cases.products.read import DeleteProductRequest, GetProductBySkuRequest, GetProductRequest, ListProductRequest
from src.use_cases.products.write import ProductWriteRequest

product_router = APIRouter(prefix="/products", tags=["products"])
MAX_CSV_BYTES = 1_000_000


@product_router.get("/", response_model=ProductListResponse)
async def list_products(
    q: str | None = None,
    category: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, alias="pageSize", ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> ProductListResponse:
    return await read_products.list_products(ListProductRequest(q=q, category=category, page=page, page_size=page_size), session)


@product_router.post("/import", response_model=ImportProductsResponse)
async def import_products(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
) -> ImportProductsResponse:
    payload = await file.read(MAX_CSV_BYTES + 1)
    if len(payload) > MAX_CSV_BYTES:
        raise DomainError("CSV file is too large.")
    try:
        content = payload.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise DomainError("CSV file must be UTF-8.") from error
    return await product_import.import_products(ImportProductsRequest(content=content), session)


@product_router.get("/by-sku/{sku}", response_model=ProductResponse)
async def get_product_by_sku(sku: str, session: AsyncSession = Depends(get_session)) -> ProductResponse:
    return await read_products.get_product_by_sku(GetProductBySkuRequest(sku=sku), session)


@product_router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, session: AsyncSession = Depends(get_session)) -> ProductResponse:
    return await read_products.get_product(GetProductRequest(product_id=product_id), session)


@product_router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(
    request: ProductWriteRequest, session: AsyncSession = Depends(get_session)
) -> ProductResponse:
    return await write_products.create_product(request, session)


@product_router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    request: ProductWriteRequest,
    session: AsyncSession = Depends(get_session),
) -> ProductResponse:
    return await write_products.update_product(product_id, request, session)


@product_router.delete("/{product_id}", response_model=DeleteProductResponse)
async def delete_product(product_id: int, session: AsyncSession = Depends(get_session)) -> DeleteProductResponse:
    return await read_products.delete_product(DeleteProductRequest(product_id=product_id), session)
