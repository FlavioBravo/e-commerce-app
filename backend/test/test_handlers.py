from decimal import Decimal
from types import SimpleNamespace

import pytest

from src.database.entities import Category, Product
from src.domain.errors import DomainError
from src.infrastructure.persistency import categories as category_store
from src.infrastructure.persistency import orders as order_store
from src.infrastructure.persistency import products as product_store
from src.use_cases.orders.place_order import PlaceOrderItemRequest, PlaceOrderRequest, place_order
from src.use_cases.products.import_products import ImportProductsRequest, import_products
from src.use_cases.products.write import ProductWriteRequest, create_product


def _session():
    state = {"flushed": False}

    async def flush():
        state["flushed"] = True

    return SimpleNamespace(flush=flush), state


def _catalog():
    state = {"products": {}, "categories": {}, "orders": [], "next_product_id": 1, "next_category_id": 1}

    async def get_product_by_sku(session, sku: str):
        return state["products"].get(sku)

    async def get_products_by_skus(session, skus: list[str]):
        return [state["products"][sku] for sku in skus if sku in state["products"]]

    async def get_products_for_update(session, product_ids: list[int]):
        return [product for product in state["products"].values() if product.id in product_ids]

    def add_product(session, product: Product) -> None:
        if product.id is None:
            product.id = state["next_product_id"]
            state["next_product_id"] += 1
        state["products"][product.sku] = product

    async def get_or_create_category(session, name: str) -> Category:
        category = state["categories"].get(name)
        if category is None:
            category = Category(name=name)
            category.id = state["next_category_id"]
            state["next_category_id"] += 1
            state["categories"][name] = category
        return category

    def add_order(session, order) -> None:
        order.id = len(state["orders"]) + 1
        state["orders"].append(order)

    return state, SimpleNamespace(
        get_product_by_sku=get_product_by_sku,
        get_products_by_skus=get_products_by_skus,
        get_products_for_update=get_products_for_update,
        add_product=add_product,
        get_or_create_category=get_or_create_category,
        add_order=add_order,
    )


@pytest.mark.asyncio
async def test_create_keeps_untrusted_name_as_text(monkeypatch):
    catalog, fakes = _catalog()
    session, session_state = _session()
    monkeypatch.setattr(product_store, "get_product_by_sku", fakes.get_product_by_sku)
    monkeypatch.setattr(product_store, "add_product", fakes.add_product)
    monkeypatch.setattr(category_store, "get_or_create_category", fakes.get_or_create_category)
    created = await create_product(
        ProductWriteRequest(
            name="<script>alert('xss')</script>",
            sku="xs-001",
            description="Totally normal product description",
            category="Electronics",
            price=Decimal("19.99"),
            stock=100,
            weight_kg=Decimal("0.1"),
        ),
        session,
    )
    stored = catalog["products"]["XS-001"]
    assert stored.name == "<script>alert('xss')</script>"
    assert created.sku == "XS-001"
    assert session_state["flushed"] is True


@pytest.mark.asyncio
async def test_import_updates_existing_sku_and_stores_sql_text(monkeypatch):
    catalog, fakes = _catalog()
    session, _session_state = _session()
    monkeypatch.setattr(product_store, "get_products_by_skus", fakes.get_products_by_skus)
    monkeypatch.setattr(product_store, "add_product", fakes.add_product)
    monkeypatch.setattr(category_store, "get_or_create_category", fakes.get_or_create_category)
    first = "\n".join(
        [
            "name,sku,description,category,price,stock,weight_kg",
            "Running Shoes,RS-001,Old,Footwear,89.99,150,0.35",
            "Robert'); DROP TABLE products;--,SQL-001,Classic SQL injection test product,Games,9.99,50,0.5",
        ]
    )
    second = "\n".join(
        [
            "name,sku,description,category,price,stock,weight_kg",
            "Running Shoes,RS-001,Updated,Footwear,94.99,120,0.35",
        ]
    )
    await import_products(ImportProductsRequest(content=first), session)
    updated = await import_products(ImportProductsRequest(content=second), session)
    assert updated.created == 0
    assert updated.updated == 1
    stored = catalog["products"]["RS-001"]
    assert stored.price == Decimal("94.99")
    assert stored.stock == 120
    assert catalog["products"]["SQL-001"].name == "Robert'); DROP TABLE products;--"


@pytest.mark.asyncio
async def test_place_order_decrements_stock_and_skips_payment_when_stock_is_short(monkeypatch):
    catalog, fakes = _catalog()
    session, _session_state = _session()
    product = Product(
        sku="VC-001",
        name="Vintage Clock",
        description="Clock",
        price=Decimal("299.99"),
        stock=1,
        weight_kg=Decimal("3.5"),
    )
    product.id = 1
    fakes.add_product(session, product)
    amounts = []

    async def charge(amount: Decimal) -> str:
        amounts.append(amount)
        return "pay_test"

    monkeypatch.setattr(product_store, "get_products_for_update", fakes.get_products_for_update)
    monkeypatch.setattr(order_store, "add_order", fakes.add_order)
    sold = await place_order(PlaceOrderRequest(items=[PlaceOrderItemRequest(product_id=1, quantity=1)]), session, charge)
    assert sold.status == "paid"
    assert sold.payment_reference == "pay_test"
    assert sold.total == Decimal("299.99")
    assert product.stock == 0
    assert amounts == [Decimal("299.99")]
    with pytest.raises(DomainError) as error:
        await place_order(PlaceOrderRequest(items=[PlaceOrderItemRequest(product_id=1, quantity=1)]), session, charge)
    assert error.value.status_code == 409
    assert amounts == [Decimal("299.99")]
    assert product.stock == 0
    assert len(catalog["orders"]) == 1
