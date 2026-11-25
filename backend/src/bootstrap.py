from logging import getLogger
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from src.domain.errors import DomainError, ErrorDetail

logger = getLogger(__name__)
app = FastAPI(title="E-commerce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthcheckResponse(BaseModel):
    status: str


@app.get("/healthcheck/", response_model=HealthcheckResponse)
def healthcheck() -> HealthcheckResponse:
    return HealthcheckResponse(status="ok")


@app.exception_handler(DomainError)
async def domain_exception_handler(request: Request, exc: DomainError) -> JSONResponse:
    logger.warning("%s %s -> %s %s", request.method, request.url.path, exc.status_code, exc.message)
    return JSONResponse(status_code=exc.status_code, content=exc.to_dict())


@app.exception_handler(RequestValidationError)
async def request_validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    details: list[ErrorDetail] = []
    for error in exc.errors():
        location = [str(part) for part in error["loc"] if part not in {"body", "query"}]
        details.append({"field": ".".join(location), "message": error["msg"]})
    logger.warning("%s %s -> 422 %s", request.method, request.url.path, details)
    return JSONResponse(status_code=422, content={"message": "Request validation failed.", "details": details})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    error_code = uuid4()
    logger.exception("Unhandled error %s", error_code)
    return JSONResponse(status_code=500, content={"message": f"Internal server error. Error code: {error_code}"})
