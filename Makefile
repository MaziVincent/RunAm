.PHONY: help infra-up infra-down backend-run backend-test web-dev mobile-user mobile-rider db-migrate db-seed test

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Infrastructure ───────────────────────────────────────────

infra-up: ## Start dev infrastructure (PostgreSQL, Redis, RabbitMQ, Seq, MailHog, MinIO)
	docker compose -f infra/docker/docker-compose.dev.yml up -d

infra-down: ## Stop dev infrastructure
	docker compose -f infra/docker/docker-compose.dev.yml down

infra-reset: ## Reset dev infrastructure (destroy volumes)
	docker compose -f infra/docker/docker-compose.dev.yml down -v

# ─── Backend ──────────────────────────────────────────────────

backend-restore: ## Restore backend NuGet packages
	dotnet restore backend/RunAm.sln

backend-build: ## Build backend
	dotnet build backend/RunAm.sln --no-restore

backend-run: ## Run backend API
	dotnet run --project backend/src/RunAm.Api

backend-watch: ## Run backend with hot reload
	dotnet watch run --project backend/src/RunAm.Api

backend-test: ## Run backend tests
	dotnet test backend/RunAm.sln --no-build --verbosity normal

# ─── Database ─────────────────────────────────────────────────

db-migrate: ## Apply EF Core migrations
	dotnet ef database update --project backend/src/RunAm.Infrastructure --startup-project backend/src/RunAm.Api

db-migration-add: ## Add new migration (usage: make db-migration-add NAME=MigrationName)
	dotnet ef migrations add $(NAME) --project backend/src/RunAm.Infrastructure --startup-project backend/src/RunAm.Api -o Persistence/Migrations

db-seed: ## Seed database with test data
	dotnet run --project backend/src/RunAm.Api -- --seed

# ─── Web Dashboard ────────────────────────────────────────────

web-install: ## Install web dependencies
	cd web && npm install

web-dev: ## Run web dashboard in development mode
	cd web && npm run dev

web-build: ## Build web dashboard for production
	cd web && npm run build

web-lint: ## Lint web dashboard
	cd web && npm run lint

# ─── Mobile ───────────────────────────────────────────────────

mobile-install: ## Install mobile dependencies
	cd mobile && npm install

mobile-user: ## Start user app
	cd mobile/apps/user && npx expo start

mobile-rider: ## Start rider app
	cd mobile/apps/rider && npx expo start

# ─── All ──────────────────────────────────────────────────────

install: backend-restore web-install mobile-install ## Install all dependencies

test: backend-test web-lint ## Run all tests and linting

clean: ## Clean all build artifacts
	dotnet clean backend/RunAm.sln
	rm -rf web/.next web/node_modules
	rm -rf mobile/node_modules mobile/apps/user/node_modules mobile/apps/rider/node_modules
