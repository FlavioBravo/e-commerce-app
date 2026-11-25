FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_NO_INTERACTION=1 \
    PATH="/code/.venv/bin:$PATH"
RUN pip install --no-cache-dir poetry==1.8.5
WORKDIR /code
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root

FROM base AS dev
COPY . /code
CMD ["uvicorn", "src.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]

FROM base AS migration
COPY . /code
CMD ["alembic", "upgrade", "head"]
