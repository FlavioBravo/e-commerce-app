from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship

from src.database.entities.shared.base import Base
from src.database.entities.shared.integer_id_entity import IntegerIdEntity


class OrderItem(Base, IntegerIdEntity):
    __tablename__ = "order_item"
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("product.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    __table_args__ = (CheckConstraint("quantity > 0", name="ck_order_item_quantity_positive"),)
