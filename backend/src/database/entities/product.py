from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from src.database.entities.shared.base import Base
from src.database.entities.shared.integer_id_entity import IntegerIdEntity


class Product(Base, IntegerIdEntity):
    __tablename__ = "product"
    sku = Column(String(40), nullable=False, unique=True)
    name = Column(String(200), nullable=False)
    description = Column(String(4000), nullable=False)
    category_id = Column(Integer, ForeignKey("category.id"), nullable=False, index=True)
    price = Column(Numeric(12, 2), nullable=False)
    stock = Column(Integer, nullable=False)
    weight_kg = Column(Numeric(12, 3), nullable=False)
    category = relationship("Category", back_populates="products")
    __table_args__ = (
        CheckConstraint("price >= 0", name="ck_product_price_non_negative"),
        CheckConstraint("stock >= 0", name="ck_product_stock_non_negative"),
        CheckConstraint("weight_kg >= 0", name="ck_product_weight_non_negative"),
    )
