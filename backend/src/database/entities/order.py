from sqlalchemy import Column, Numeric, String
from sqlalchemy.orm import relationship

from src.database.entities.shared.base import Base
from src.database.entities.shared.integer_id_entity import IntegerIdEntity


class Order(Base, IntegerIdEntity):
    __tablename__ = "orders"
    status = Column(String(20), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)
    payment_reference = Column(String(64), nullable=False)
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
