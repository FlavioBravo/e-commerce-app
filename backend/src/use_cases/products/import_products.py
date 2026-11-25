import asyncio

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.database.entities import Product
from src.domain.csv_import import classify_csv
from src.domain.errors import DomainError
from src.infrastructure.persistency import categories as category_store
from src.infrastructure.persistency import products as product_store
from src.shared.serializers import BaseSchema
from src.use_cases.catalog import ImportProductsResponse, ImportRowResponse


class ImportProductsRequest(BaseSchema):
    content: str


async def import_products(request: ImportProductsRequest, session: AsyncSession) -> ImportProductsResponse:
    classification = await asyncio.to_thread(classify_csv, request.content)
    accepted = classification.accepted
    existing_products = await product_store.get_products_by_skus(
        session, [row.product.sku for row in accepted if row.product is not None]
    )
    existing = {product.sku: product for product in existing_products}
    categories = {}
    rows: list[ImportRowResponse] = []
    created = 0
    updated = 0
    for row in classification.rows:
        if row.status != "accepted" or row.product is None:
            rows.append(
                ImportRowResponse(line=row.line, sku=row.sku, name=row.name, status=row.status, messages=row.messages)
            )
            continue
        product_data = row.product
        category = categories.get(product_data.category)
        if category is None:
            category = await category_store.get_or_create_category(session, product_data.category)
            categories[product_data.category] = category
        current = existing.get(product_data.sku)
        if current is None:
            current = Product(
                sku=product_data.sku,
                name=product_data.name,
                description=product_data.description,
                price=product_data.price,
                stock=product_data.stock,
                weight_kg=product_data.weight_kg,
            )
            current.category = category
            product_store.add_product(session, current)
            existing[product_data.sku] = current
            status = "created"
            created += 1
        else:
            current.name = product_data.name
            current.description = product_data.description
            current.price = product_data.price
            current.stock = product_data.stock
            current.weight_kg = product_data.weight_kg
            current.category = category
            status = "updated"
            updated += 1
        rows.append(
            ImportRowResponse(line=row.line, sku=product_data.sku, name=product_data.name, status=status, messages=[])
        )
    try:
        await session.flush()
    except IntegrityError as error:
        raise DomainError("The catalog could not be saved because a unique value already exists.", 409) from error
    return ImportProductsResponse(
        created=created,
        updated=updated,
        rejected=sum(1 for row in rows if row.status == "rejected"),
        skipped=sum(1 for row in rows if row.status == "skipped"),
        superseded=sum(1 for row in rows if row.status == "superseded"),
        rows=rows,
    )
