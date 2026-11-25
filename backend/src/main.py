from src.bootstrap import app
from src.routes import category_router, order_router, product_router

app.include_router(category_router)
app.include_router(order_router)
app.include_router(product_router)
