# RunAm — Errand & Logistics Platform

A full-stack errand and logistics platform connecting users who need tasks done with riders who fulfill them.

## Architecture

| Component        | Technology              | Path                 |
| ---------------- | ----------------------- | -------------------- |
| Backend API      | C# / .NET 8             | `backend/`           |
| Web Dashboard    | Next.js 14 (App Router) | `web/`               |
| User Mobile App  | React Native (Expo)     | `mobile/apps/user/`  |
| Rider Mobile App | React Native (Expo)     | `mobile/apps/rider/` |

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## Quick Start

```bash
# 1. Start infrastructure (PostgreSQL, Redis, RabbitMQ)
make infra-up

# 2. Run backend
make backend-run

# 3. Run web dashboard
make web-dev

# 4. Run mobile (user app)
make mobile-user

# 5. Run mobile (rider app)
make mobile-rider
```

## Development

```bash
# Run all tests
make test

# Apply database migrations
make db-migrate

# Seed database
make db-seed

# View API docs
# Navigate to http://localhost:5000/scalar
```

## Project Structure

```
RunAm/
├── backend/          # .NET 8 API (Clean Architecture)
├── web/              # Next.js 14 Admin Dashboard
├── mobile/           # React Native (Expo) Apps
│   ├── apps/user/    # User App
│   ├── apps/rider/   # Rider App
│   └── packages/shared/  # Shared mobile code
├── infra/            # Docker, Terraform, K8s
├── shared/           # Cross-platform contracts
└── docs/             # Documentation
```

## License

Proprietary — All rights reserved.
