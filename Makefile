.PHONY: build up down logs restart clean dev

# Build all containers
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Start with build
up-build:
	docker-compose up -d --build

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Logs for specific service
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f db

# Restart all services
restart:
	docker-compose restart

# Clean up (remove volumes too)
clean:
	docker-compose down -v --rmi local

# Development mode (local without docker)
dev:
	@echo "Starting development servers..."
	@cd backend && npm run dev &
	@cd frontend && npm run dev

# Database shell
db-shell:
	docker-compose exec db psql -U kpd_user -d kpd_platform

# Backend shell
backend-shell:
	docker-compose exec backend sh

# Rebuild specific service
rebuild-backend:
	docker-compose up -d --build backend

rebuild-frontend:
	docker-compose up -d --build frontend
