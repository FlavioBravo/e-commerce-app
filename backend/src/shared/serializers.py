from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer
from pydantic.alias_generators import to_camel


def format_money(value: Decimal) -> str:
    return f"{value.quantize(Decimal('0.01')):.2f}"


def format_weight(value: Decimal) -> str:
    text = f"{value.quantize(Decimal('0.001')):.3f}"
    return text.rstrip("0").rstrip(".")


Money = Annotated[Decimal, PlainSerializer(format_money, return_type=str, when_used="json")]
Weight = Annotated[Decimal, PlainSerializer(format_weight, return_type=str, when_used="json")]


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
