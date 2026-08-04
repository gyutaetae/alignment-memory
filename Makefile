.PHONY: setup lint test build check

setup:
	uv sync --project backend --group dev
	npm --prefix apps/web ci

lint:
	uv run --project backend ruff check backend/src backend/tests
	npm --prefix apps/web run lint

test:
	uv run --project backend pytest -q
	npm --prefix apps/web test -- --run

build:
	npm --prefix apps/web run build

check: lint test build
	git diff --check
