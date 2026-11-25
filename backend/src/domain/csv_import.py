import csv
import io
from dataclasses import dataclass, replace

from src.domain.catalog import CatalogProduct, validate_catalog_fields
from src.domain.errors import DomainError

REQUIRED_COLUMNS = ("name", "sku", "description", "category", "price", "stock", "weight_kg")


@dataclass(frozen=True)
class ClassifiedRow:
    line: int
    sku: str | None
    name: str | None
    status: str
    messages: list[str]
    product: CatalogProduct | None


@dataclass(frozen=True)
class CsvClassification:
    rows: list[ClassifiedRow]

    @property
    def accepted(self) -> list[ClassifiedRow]:
        return [row for row in self.rows if row.status == "accepted"]


def classify_csv(content: str) -> CsvClassification:
    if content.strip() == "":
        raise DomainError("CSV file is empty.")
    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise DomainError("CSV header is missing.")
    fieldnames = [(name or "").strip().lower() for name in reader.fieldnames]
    if any(name == "" for name in fieldnames):
        raise DomainError("CSV header contains an empty column.")
    if len(fieldnames) != len(set(fieldnames)):
        raise DomainError("CSV header contains duplicate columns.")
    missing = [column for column in REQUIRED_COLUMNS if column not in fieldnames]
    if missing:
        raise DomainError(f"CSV is missing columns: {', '.join(missing)}.")
    key_map = {original: normalized for original, normalized in zip(reader.fieldnames, fieldnames)}
    rows: list[ClassifiedRow] = []
    accepted_index_by_sku: dict[str, int] = {}
    for raw_row in reader:
        values = {key_map[key]: raw_row.get(key) for key in key_map}
        line = reader.line_num
        raw_sku = (values.get("sku") or "").strip()
        raw_name = (values.get("name") or "").strip()
        if _is_blank(values):
            rows.append(ClassifiedRow(line, None, None, "skipped", [], None))
            continue
        product, errors = validate_catalog_fields(
            name=values.get("name"),
            sku=values.get("sku"),
            description=values.get("description"),
            category=values.get("category"),
            price=values.get("price"),
            stock=values.get("stock"),
            weight_kg=values.get("weight_kg"),
        )
        display_sku = product.sku if product else (raw_sku.upper() or None)
        display_name = product.name if product else (raw_name or None)
        if errors or product is None:
            rows.append(
                ClassifiedRow(
                    line=line,
                    sku=display_sku,
                    name=display_name,
                    status="rejected",
                    messages=[error.message for error in errors],
                    product=None,
                )
            )
            continue
        previous_index = accepted_index_by_sku.get(product.sku)
        if previous_index is not None:
            previous = rows[previous_index]
            rows[previous_index] = replace(
                previous,
                status="superseded",
                messages=["A later row with the same SKU replaced this one."],
                product=None,
            )
        rows.append(ClassifiedRow(line, product.sku, product.name, "accepted", [], product))
        accepted_index_by_sku[product.sku] = len(rows) - 1
    return CsvClassification(rows)


def _is_blank(values: dict[str, str | None]) -> bool:
    return all((value or "").strip() == "" for value in values.values())
