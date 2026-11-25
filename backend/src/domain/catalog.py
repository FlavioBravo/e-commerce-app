import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

SKU_PATTERN = re.compile(r"^[A-Z0-9]+(?:-[A-Z0-9]+)*$")
DECIMAL_PATTERN = re.compile(r"-?\d+(?:\.\d+)?$")
INTEGER_PATTERN = re.compile(r"-?\d+$")
NAME_MAX_LENGTH = 200
DESCRIPTION_MAX_LENGTH = 4000
CATEGORY_MAX_LENGTH = 80
SKU_MAX_LENGTH = 40


@dataclass(frozen=True)
class FieldError:
    field: str
    message: str


@dataclass(frozen=True)
class CatalogProduct:
    name: str
    sku: str
    description: str
    category: str
    price: Decimal
    stock: int
    weight_kg: Decimal


def validate_catalog_fields(
    name: object,
    sku: object,
    description: object,
    category: object,
    price: object,
    stock: object,
    weight_kg: object,
) -> tuple[CatalogProduct | None, list[FieldError]]:
    errors: list[FieldError] = []
    clean_name = _required_text(name, "name", "Name", NAME_MAX_LENGTH, errors)
    clean_sku = _sku(sku, errors)
    clean_description = _required_text(description, "description", "Description", DESCRIPTION_MAX_LENGTH, errors)
    clean_category = _required_text(category, "category", "Category", CATEGORY_MAX_LENGTH, errors)
    clean_price = _price(price, errors)
    clean_stock = _stock(stock, errors)
    clean_weight = _weight(weight_kg, errors)
    if errors or clean_name is None or clean_sku is None or clean_description is None or clean_category is None:
        return None, errors
    if clean_price is None or clean_stock is None or clean_weight is None:
        return None, errors
    return (
        CatalogProduct(
            name=clean_name,
            sku=clean_sku,
            description=clean_description,
            category=clean_category,
            price=clean_price,
            stock=clean_stock,
            weight_kg=clean_weight,
        ),
        [],
    )


def _required_text(value: object, field: str, label: str, max_length: int, errors: list[FieldError]) -> str | None:
    text = "" if value is None else str(value).strip()
    if text == "":
        errors.append(FieldError(field, f"{label} is required."))
        return None
    if len(text) > max_length:
        errors.append(FieldError(field, f"{label} must be {max_length} characters or fewer."))
        return None
    return text


def _sku(value: object, errors: list[FieldError]) -> str | None:
    text = "" if value is None else str(value).strip().upper()
    if text == "":
        errors.append(FieldError("sku", "SKU is required."))
        return None
    if len(text) > SKU_MAX_LENGTH or SKU_PATTERN.fullmatch(text) is None:
        errors.append(FieldError("sku", "SKU must contain only letters, numbers, and hyphens."))
        return None
    return text


def _price(value: object, errors: list[FieldError]) -> Decimal | None:
    amount = _decimal(value, "price", "Price", errors)
    if amount is None:
        return None
    if amount < 0:
        errors.append(FieldError("price", "Price cannot be negative."))
        return None
    if _decimal_places(amount) > 2:
        errors.append(FieldError("price", "Price cannot have more than 2 decimal places."))
        return None
    return amount.quantize(Decimal("0.01"))


def _weight(value: object, errors: list[FieldError]) -> Decimal | None:
    amount = _decimal(value, "weight_kg", "Weight", errors)
    if amount is None:
        return None
    if amount < 0:
        errors.append(FieldError("weight_kg", "Weight cannot be negative."))
        return None
    if _decimal_places(amount) > 3:
        errors.append(FieldError("weight_kg", "Weight cannot have more than 3 decimal places."))
        return None
    return amount.quantize(Decimal("0.001"))


def _stock(value: object, errors: list[FieldError]) -> int | None:
    if isinstance(value, bool) or value is None:
        errors.append(FieldError("stock", "Stock is required."))
        return None
    if isinstance(value, int):
        number = value
    else:
        text = str(value).strip()
        if text == "":
            errors.append(FieldError("stock", "Stock is required."))
            return None
        if INTEGER_PATTERN.fullmatch(text) is None:
            errors.append(FieldError("stock", "Stock must be an integer."))
            return None
        number = int(text)
    if number < 0:
        errors.append(FieldError("stock", "Stock cannot be negative."))
        return None
    return number


def _decimal(value: object, field: str, label: str, errors: list[FieldError]) -> Decimal | None:
    if isinstance(value, bool) or value is None:
        errors.append(FieldError(field, f"{label} is required."))
        return None
    if isinstance(value, Decimal):
        return value
    if isinstance(value, int):
        return Decimal(value)
    text = str(value).strip()
    if text.startswith("$"):
        text = text[1:].strip()
    if text == "":
        errors.append(FieldError(field, f"{label} is required."))
        return None
    if DECIMAL_PATTERN.fullmatch(text) is None:
        errors.append(FieldError(field, f"{label} must be a decimal number."))
        return None
    try:
        return Decimal(text)
    except InvalidOperation:
        errors.append(FieldError(field, f"{label} must be a decimal number."))
        return None


def _decimal_places(value: Decimal) -> int:
    exponent = value.as_tuple().exponent
    if isinstance(exponent, int) and exponent < 0:
        return -exponent
    return 0
