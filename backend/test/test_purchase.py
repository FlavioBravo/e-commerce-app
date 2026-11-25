from decimal import Decimal

import pytest

from src.domain.errors import DomainError
from src.domain.purchase import RequestedItem, StockItem, plan_purchase


def _stock(product_id: int, sku: str, price: str, stock: int) -> StockItem:
    return StockItem(product_id, sku, sku, Decimal(price), stock)


def test_purchase_merges_lines_and_snapshots_database_price():
    plan = plan_purchase(
        [RequestedItem(1, 1), RequestedItem(1, 2), RequestedItem(2, 1)],
        [_stock(1, "RS-001", "10.00", 3), _stock(2, "MB-001", "0.00", 4)],
    )
    assert [(item.product_id, item.quantity, item.unit_price) for item in plan.items] == [
        (1, 3, Decimal("10.00")),
        (2, 1, Decimal("0.00")),
    ]
    assert plan.total == Decimal("30.00")


def test_purchase_rejects_missing_stock_and_zero_stock():
    with pytest.raises(DomainError) as missing:
        plan_purchase([RequestedItem(9, 1)], [])
    assert missing.value.status_code == 404
    with pytest.raises(DomainError) as shortage:
        plan_purchase([RequestedItem(1, 1)], [_stock(1, "VC-001", "299.99", 0)])
    assert shortage.value.status_code == 409
    assert shortage.value.details[0]["available"] == 0
    with pytest.raises(DomainError) as partial:
        plan_purchase(
            [RequestedItem(1, 2), RequestedItem(2, 1)],
            [_stock(1, "RS-001", "10.00", 1), _stock(2, "CB-010", "18.75", 5)],
        )
    assert partial.value.status_code == 409
    assert len(partial.value.details) == 1
    assert partial.value.details[0]["sku"] == "RS-001"
