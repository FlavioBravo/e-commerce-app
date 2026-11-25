from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.payments import Charge, get_payment_gateway
from src.infrastructure.persistency import get_session
from src.use_cases.catalog import OrderResponse
from src.use_cases.orders import place_order as orders
from src.use_cases.orders.place_order import GetOrderRequest, PlaceOrderRequest

order_router = APIRouter(prefix="/orders", tags=["orders"])


@order_router.post("/", response_model=OrderResponse, status_code=201)
async def place_order(
    request: PlaceOrderRequest,
    session: AsyncSession = Depends(get_session),
    charge: Charge = Depends(get_payment_gateway),
) -> OrderResponse:
    return await orders.place_order(request, session, charge)


@order_router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: int, session: AsyncSession = Depends(get_session)) -> OrderResponse:
    return await orders.get_order(GetOrderRequest(order_id=order_id), session)
