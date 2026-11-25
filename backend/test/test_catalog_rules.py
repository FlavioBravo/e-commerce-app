from decimal import Decimal
from pathlib import Path

import pytest

from src.domain.catalog import validate_catalog_fields
from src.domain.csv_import import classify_csv
from src.domain.errors import DomainError

FIXTURE = Path(__file__).parent / "fixtures" / "Code_Challenge_E-Commerce.csv"


def test_currency_prefix_and_zero_price_are_accepted():
    product, errors = validate_catalog_fields(
        name="Wireless Mouse",
        sku="wm-042",
        description="Ergonomic wireless mouse",
        category="Electronics",
        price="$29.99",
        stock="75",
        weight_kg="0.12",
    )
    assert errors == []
    assert product is not None
    assert product.sku == "WM-042"
    assert product.price == Decimal("29.99")
    free_product, free_errors = validate_catalog_fields(
        name="Mystery Box",
        sku="MB-001",
        description="Surprise assortment",
        category="Gifts",
        price="0.00",
        stock="50",
        weight_kg="1",
    )
    assert free_errors == []
    assert free_product is not None
    assert free_product.price == Decimal("0.00")
    assert free_product.weight_kg == Decimal("1.000")


def test_unsafe_names_stay_literal_text():
    script, script_errors = validate_catalog_fields(
        name="<script>alert('xss')</script>",
        sku="XS-001",
        description="Totally normal product description",
        category="Electronics",
        price="19.99",
        stock="100",
        weight_kg="0.1",
    )
    injected, injected_errors = validate_catalog_fields(
        name="Robert'); DROP TABLE products;--",
        sku="SQL-001",
        description="Classic SQL injection test product",
        category="Games",
        price="9.99",
        stock="50",
        weight_kg="0.5",
    )
    assert script_errors == []
    assert injected_errors == []
    assert script is not None and script.name == "<script>alert('xss')</script>"
    assert injected is not None and injected.name == "Robert'); DROP TABLE products;--"


def test_invalid_price_stock_weight_and_blank_name_are_rejected():
    _, free_errors = validate_catalog_fields("Yoga Mat", "YM-015", "Mat", "Sports", "free", "200", "1.2")
    _, negative_errors = validate_catalog_fields("Desk Lamp", "DL-007", "Lamp", "Home & Office", "45.50", "-5", "2.1")
    _, weight_errors = validate_catalog_fields("Keyboard", "GK-088", "Keyboard", "Electronics", "129.99", "45", "")
    _, name_errors = validate_catalog_fields("   ", "WS-001", "Whitespace name", "Misc", "5.00", "10", "0.1")
    assert [error.message for error in free_errors] == ["Price must be a decimal number."]
    assert [error.message for error in negative_errors] == ["Stock cannot be negative."]
    assert [error.message for error in weight_errors] == ["Weight is required."]
    assert [error.message for error in name_errors] == ["Name is required."]


def test_zero_stock_and_zero_weight_are_valid():
    product, errors = validate_catalog_fields("Gift Card", "GC-025", "Digital gift card", "Gifts", "25.00", "0", "0")
    assert errors == []
    assert product is not None
    assert product.stock == 0
    assert product.weight_kg == Decimal("0.000")


def test_example_csv_classification():
    classification = classify_csv(FIXTURE.read_text(encoding="utf-8"))
    by_status: dict[str, list] = {}
    for row in classification.rows:
        by_status.setdefault(row.status, []).append(row)
    assert len(by_status["rejected"]) == 6
    assert len(by_status["skipped"]) == 2
    assert len(by_status["superseded"]) == 3
    assert len(by_status["accepted"]) == 86
    rejected = {row.sku: row.messages for row in by_status["rejected"]}
    assert rejected["YM-015"] == ["Price must be a decimal number."]
    assert rejected["DL-007"] == ["Stock cannot be negative."]
    assert rejected["GK-088"] == ["Weight is required."]
    assert rejected["GC-025"] == ["Category is required."]
    assert rejected["HD-099"] == ["Name is required."]
    assert rejected["WS-001"] == ["Name is required."]
    winners = {row.sku: row.product for row in by_status["accepted"]}
    assert winners["RS-001"].price == Decimal("94.99")
    assert winners["RS-001"].stock == 120
    assert winners["BS-021"].price == Decimal("59.99")
    assert winners["XS-001"].name == "<script>alert('xss')</script>"
    assert winners["SQL-001"].name == "Robert'); DROP TABLE products;--"
    assert winners["CI-001"].name == "Comma, In Product Name"
    assert winners["QI-001"].name == 'Quote "Inside" Name'
    assert winners["MB-001"].price == Decimal("0.00")
    assert winners["VC-001"].stock == 0
    assert "™" in winners["WB-033"].description
    mouse = winners["WM-042"]
    assert mouse.price == Decimal("29.99")


def test_later_invalid_row_does_not_replace_a_valid_sku():
    content = "\n".join(
        [
            "name,sku,description,category,price,stock,weight_kg",
            "Shoes,RS-001,First,Footwear,10.00,5,0.3",
            "Shoes,RS-001,Broken,Footwear,free,5,0.3",
        ]
    )
    classification = classify_csv(content)
    statuses = [(row.line, row.status) for row in classification.rows]
    assert statuses == [(2, "accepted"), (3, "rejected")]
    assert classification.accepted[0].product.price == Decimal("10.00")


def test_missing_column_and_empty_file_are_file_errors():
    with pytest.raises(DomainError, match="missing columns"):
        classify_csv("name,sku\nShoes,RS-001\n")
    with pytest.raises(DomainError, match="empty"):
        classify_csv("   \n")
