from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from src.database.entities.shared.base import Base
from src.database.entities.shared.integer_id_entity import IntegerIdEntity


class Category(Base, IntegerIdEntity):
    __tablename__ = "category"
    name = Column(String(80), nullable=False, unique=True)
    products = relationship("Product", back_populates="category")
