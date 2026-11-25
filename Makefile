up:
	docker compose up --build

down:
	docker compose down -v

unit-test-api:
	docker compose run --rm --build --no-deps server pytest

unit-test-ui:
	docker compose run --rm --build --no-deps ui npm test -- --watchman=false --forceExit
