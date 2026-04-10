.PHONY: start login build-configure build lint typecheck

start:
	docker compose run --rm app

login:
	docker compose run --rm -e EAS_NO_VCS=1 app npx eas-cli login

build-configure:
	docker compose run --rm -e EAS_NO_VCS=1 app npx eas-cli build:configure

build:
	docker compose run --rm -e EAS_NO_VCS=1 app npx eas-cli build --platform android --profile preview

lint:
	docker compose run --rm app npm run lint

typecheck:
	docker compose run --rm app npx tsc --noEmit
