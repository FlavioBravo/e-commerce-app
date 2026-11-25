from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.entities import Product
from src.domain.catalog import CatalogProduct, validate_catalog_fields
from src.domain.errors import DomainError
from src.infrastructure.persistency import categories as category_store
from src.infrastructure.persistency import products as product_store
from src.shared.serializers import BaseSchema
from src.use_cases.catalog import ProductResponse, to_product_response


class ProductWriteRequest(BaseSchema):
    name: str
    sku: str
    description: str
    category: str
    price: Decimal
    stock: int
    weight_kg: Decimal


async def create_product(request: ProductWriteRequest, session: AsyncSession) -> ProductResponse:
    product_data = _validated_product(request)
    existing = await product_store.get_product_by_sku(session, product_data.sku)
    if existing is not None:
        raise DomainError("SKU already exists.", status_code=409)
    category = await category_store.get_or_create_category(session, product_data.category)
    product = Product(
        sku=product_data.sku,
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        stock=product_data.stock,
        weight_kg=product_data.weight_kg,
    )
    product.category = category
    product_store.add_product(session, product)
    await _flush(session)
    return to_product_response(product)


async def update_product(product_id: int, request: ProductWriteRequest, session: AsyncSession) -> ProductResponse:
    product = await product_store.get_product(session, product_id)
    if product is None:
        raise DomainError("Product not found.", status_code=404)
    product_data = _validated_product(request)
    existing = await product_store.get_product_by_sku(session, product_data.sku)
    if existing is not None and existing.id != product.id:
        raise DomainError("SKU already exists.", status_code=409)
    category = await category_store.get_or_create_category(session, product_data.category)
    product.sku = product_data.sku
    product.name = product_data.name
    product.description = product_data.description
    product.price = product_data.price
    product.stock = product_data.stock
    product.weight_kg = product_data.weight_kg
    product.category = category
    await _flush(session)
    return to_product_response(product)


def _validated_product(request: ProductWriteRequest) -> CatalogProduct:
    product_data, errors = validate_catalog_fields(
        name=request.name,
        sku=request.sku,
        description=request.description,
        category=request.category,
        price=request.price,
        stock=request.stock,
        weight_kg=request.weight_kg,
    )
    if product_data is None:
        raise DomainError(
            "Invalid product.",
            details=[{"field": error.field, "message": error.message} for error in errors],
        )
    return product_data


async def _flush(session: AsyncSession) -> None:
    try:
        await session.flush()
    except IntegrityError as error:
        raise DomainError("SKU already exists.", status_code=409) from error
