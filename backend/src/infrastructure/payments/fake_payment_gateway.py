from collections.abc import Awaitable, Callable
from decimal import Decimal
from uuid import uuid4

Charge = Callable[[Decimal], Awaitable[str]]


async def fake_charge(amount: Decimal) -> str:
    return f"pay_{uuid4().hex}"


def get_payment_gateway() -> Charge:
    return fake_charge
