# RunAm — Implementation Plan

> **Version:** 1.0  
> **Last Updated:** February 10, 2026  
> **Estimated Timeline:** 32 weeks (8 months)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  User App    │  │  Rider App   │  │  Web Dashboard       │   │
│  │  React Native│  │  React Native│  │  Next.js 14          │   │
│  │  (Expo)      │  │  (Expo)      │  │  (App Router)        │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
└─────────┼─────────────────┼──────────────────────┼───────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway / Load Balancer                  │
│                     (YARP / Nginx / Azure API Management)       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                     Backend Services (.NET 8)                    │
│  ┌────────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐   │
│  │ Auth       │ │ Errand    │ │ Payment   │ │ Notification │   │
│  │ Service    │ │ Service   │ │ Service   │ │ Service      │   │
│  ├────────────┤ ├───────────┤ ├───────────┤ ├──────────────┤   │
│  │ User       │ │ Matching  │ │ Wallet    │ │ Analytics    │   │
│  │ Service    │ │ Service   │ │ Service   │ │ Service      │   │
│  ├────────────┤ ├───────────┤ ├───────────┤ ├──────────────┤   │
│  │ Merchant   │ │ Tracking  │ │ Pricing   │ │ Admin        │   │
│  │ Service    │ │ Service   │ │ Service   │ │ Service      │   │
│  └────────────┘ └───────────┘ └───────────┘ └──────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                     Data & Infrastructure Layer                  │
│  ┌────────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐   │
│  │ PostgreSQL │ │ Redis     │ │ RabbitMQ/ │ │ Blob Storage │   │
│  │ (Primary   │ │ (Cache +  │ │ Azure     │ │ (S3/Azure    │   │
│  │  Database) │ │  Pub/Sub) │ │ Svc Bus   │ │  Blob)       │   │
│  └────────────┘ └───────────┘ └───────────┘ └──────────────┘   │
│  ┌────────────┐ ┌───────────────────────────────────────────┐   │
│  │ SignalR    │ │ Observability: Seq / ELK / App Insights   │   │
│  │ (Real-time)│ │ Sentry (errors) · Prometheus (metrics)    │   │
│  └────────────┘ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack (Detailed)

### 2.1 Backend (C# / .NET 8)

| Layer           | Technology                                  | Purpose                            |
| --------------- | ------------------------------------------- | ---------------------------------- |
| Framework       | ASP.NET Core 8 (Minimal APIs + Controllers) | REST API                           |
| Architecture    | Vertical Slice / Clean Architecture hybrid  | Code organization                  |
| ORM             | Entity Framework Core 8                     | Database access                    |
| Database        | PostgreSQL 16                               | Primary data store                 |
| Cache           | Redis 7 (StackExchange.Redis)               | Caching, session, pub/sub          |
| Message Queue   | RabbitMQ (MassTransit)                      | Async event processing             |
| Real-time       | SignalR                                     | WebSocket for live tracking & chat |
| Authentication  | ASP.NET Identity + JWT Bearer               | Auth & authorization               |
| Validation      | FluentValidation                            | Request validation                 |
| Mapping         | Mapster or AutoMapper                       | DTO mapping                        |
| API Docs        | Swagger / Scalar                            | API documentation                  |
| Background Jobs | Hangfire or Quartz.NET                      | Scheduled tasks, payouts           |
| Logging         | Serilog → Seq / Elasticsearch               | Structured logging                 |
| Testing         | xUnit + Moq + Testcontainers                | Unit & integration tests           |
| Rate Limiting   | ASP.NET Rate Limiting middleware            | API protection                     |
| Health Checks   | ASP.NET Health Checks                       | Service monitoring                 |

### 2.2 Frontend — Web Dashboard (Next.js 14)

| Layer            | Technology                  | Purpose                    |
| ---------------- | --------------------------- | -------------------------- |
| Framework        | Next.js 14 (App Router)     | SSR + SPA hybrid           |
| Language         | TypeScript 5                | Type safety                |
| UI Library       | shadcn/ui + Tailwind CSS 3  | Component library          |
| State Management | Zustand + TanStack Query v5 | Client & server state      |
| Forms            | React Hook Form + Zod       | Form handling & validation |
| Charts           | Recharts                    | Data visualization         |
| Maps             | Mapbox GL JS                | Map rendering              |
| Tables           | TanStack Table              | Data tables                |
| Real-time        | @microsoft/signalr          | WebSocket client           |
| Auth             | NextAuth.js v5              | Authentication             |
| Testing          | Vitest + Playwright         | Unit & E2E tests           |
| Linting          | ESLint + Prettier           | Code quality               |

### 2.3 Mobile Apps (React Native / Expo)

| Layer              | Technology                                  | Purpose               |
| ------------------ | ------------------------------------------- | --------------------- |
| Framework          | React Native 0.74+ (Expo SDK 52)            | Cross-platform mobile |
| Language           | TypeScript 5                                | Type safety           |
| Navigation         | Expo Router (file-based)                    | Navigation            |
| UI Library         | Tamagui or NativeWind                       | Styling               |
| State Management   | Zustand + TanStack Query                    | Client & server state |
| Maps               | react-native-maps + Mapbox                  | Map rendering         |
| Location           | expo-location                               | GPS tracking          |
| Camera             | expo-camera + expo-image-picker             | Photo capture         |
| Push Notifications | expo-notifications + FCM/APNs               | Push notifications    |
| Local Storage      | expo-secure-store + MMKV                    | Secure local storage  |
| Animations         | React Native Reanimated 3                   | Smooth animations     |
| Gestures           | React Native Gesture Handler                | Touch interactions    |
| Real-time          | @microsoft/signalr (React Native)           | WebSocket             |
| Biometrics         | expo-local-authentication                   | Fingerprint/Face ID   |
| Deep Linking       | Expo Linking                                | URL scheme handling   |
| Testing            | Jest + React Native Testing Library + Detox | Testing               |
| OTA Updates        | EAS Update                                  | Over-the-air updates  |
| Build              | EAS Build                                   | Cloud builds          |

---

## 3. Project Structure

### 3.1 Repository Strategy: Monorepo

```
RunAm/
├── docs/                          # Documentation
│   ├── FEATURES.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── API.md
│   └── architecture/
│       └── diagrams/
│
├── backend/                       # C# Backend
│   ├── RunAm.sln
│   ├── src/
│   │   ├── RunAm.Api/             # API host (Program.cs, middleware, endpoints)
│   │   │   ├── Controllers/
│   │   │   ├── Endpoints/
│   │   │   ├── Middleware/
│   │   │   ├── Hubs/              # SignalR hubs
│   │   │   ├── Filters/
│   │   │   └── Program.cs
│   │   │
│   │   ├── RunAm.Application/     # Business logic, CQRS handlers
│   │   │   ├── Common/
│   │   │   ├── Auth/
│   │   │   ├── Errands/
│   │   │   │   ├── Commands/
│   │   │   │   ├── Queries/
│   │   │   │   ├── Events/
│   │   │   │   └── Validators/
│   │   │   ├── Payments/
│   │   │   ├── Users/
│   │   │   ├── Riders/
│   │   │   ├── Merchants/
│   │   │   ├── Matching/
│   │   │   ├── Tracking/
│   │   │   ├── Notifications/
│   │   │   └── Admin/
│   │   │
│   │   ├── RunAm.Domain/          # Domain models, entities, value objects
│   │   │   ├── Entities/
│   │   │   ├── ValueObjects/
│   │   │   ├── Enums/
│   │   │   ├── Events/
│   │   │   ├── Exceptions/
│   │   │   └── Interfaces/
│   │   │
│   │   ├── RunAm.Infrastructure/  # External concerns
│   │   │   ├── Persistence/
│   │   │   │   ├── Configurations/  # EF entity configs
│   │   │   │   ├── Migrations/
│   │   │   │   ├── Repositories/
│   │   │   │   └── AppDbContext.cs
│   │   │   ├── Caching/
│   │   │   ├── Messaging/
│   │   │   ├── Identity/
│   │   │   ├── Payment/
│   │   │   ├── Notifications/
│   │   │   ├── Storage/
│   │   │   ├── Maps/
│   │   │   └── BackgroundJobs/
│   │   │
│   │   └── RunAm.Shared/          # Shared DTOs, contracts
│   │       ├── DTOs/
│   │       ├── Contracts/
│   │       └── Constants/
│   │
│   └── tests/
│       ├── RunAm.UnitTests/
│       ├── RunAm.IntegrationTests/
│       └── RunAm.ArchTests/
│
├── web/                           # Next.js Web Dashboard
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx          # Dashboard home
│   │   │   │   ├── users/
│   │   │   │   ├── riders/
│   │   │   │   ├── errands/
│   │   │   │   ├── merchants/
│   │   │   │   ├── finance/
│   │   │   │   ├── analytics/
│   │   │   │   ├── pricing/
│   │   │   │   ├── promotions/
│   │   │   │   ├── support/
│   │   │   │   └── settings/
│   │   │   ├── (marketing)/
│   │   │   │   ├── page.tsx          # Landing page
│   │   │   │   ├── about/
│   │   │   │   ├── pricing/
│   │   │   │   └── contact/
│   │   │   ├── api/                  # API routes (auth callbacks)
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── dashboard/
│   │   │   ├── maps/
│   │   │   ├── charts/
│   │   │   └── shared/
│   │   ├── lib/
│   │   │   ├── api/                  # API client functions
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   ├── stores/               # Zustand stores
│   │   │   └── validators/
│   │   ├── types/
│   │   └── styles/
│   └── public/
│
├── mobile/                        # React Native (Expo) Monorepo
│   ├── package.json
│   ├── apps/
│   │   ├── user/                  # User App
│   │   │   ├── app.json
│   │   │   ├── app/               # Expo Router file-based routes
│   │   │   │   ├── (tabs)/
│   │   │   │   │   ├── index.tsx      # Home
│   │   │   │   │   ├── activity.tsx   # My Errands
│   │   │   │   │   ├── wallet.tsx     # Wallet
│   │   │   │   │   └── profile.tsx    # Profile
│   │   │   │   ├── (auth)/
│   │   │   │   ├── errand/
│   │   │   │   │   ├── new.tsx
│   │   │   │   │   └── [id].tsx       # Errand detail + tracking
│   │   │   │   ├── chat/
│   │   │   │   └── _layout.tsx
│   │   │   └── assets/
│   │   │
│   │   └── rider/                 # Rider App
│   │       ├── app.json
│   │       ├── app/               # Expo Router
│   │       │   ├── (tabs)/
│   │       │   │   ├── index.tsx      # Task queue / map
│   │       │   │   ├── tasks.tsx      # Active tasks
│   │       │   │   ├── earnings.tsx   # Earnings
│   │       │   │   └── profile.tsx    # Profile
│   │       │   ├── (auth)/
│   │       │   ├── (onboarding)/
│   │       │   ├── task/
│   │       │   │   └── [id].tsx       # Task detail + navigation
│   │       │   └── _layout.tsx
│   │       └── assets/
│   │
│   └── packages/
│       └── shared/                # Shared mobile code
│           ├── api/               # API client (Axios/Ky)
│           ├── components/        # Shared UI components
│           ├── hooks/             # Shared hooks
│           ├── stores/            # Shared Zustand stores
│           ├── types/             # Shared TypeScript types
│           └── utils/             # Shared utilities
│
├── shared/                        # Cross-platform shared
│   └── api-contracts/             # OpenAPI spec or TypeScript types
│
├── infra/                         # Infrastructure as Code
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   ├── backend.Dockerfile
│   │   └── web.Dockerfile
│   ├── terraform/                 # or Pulumi
│   └── k8s/
│
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       ├── web-ci.yml
│       ├── mobile-ci.yml
│       └── deploy.yml
│
├── .gitignore
├── README.md
└── Makefile                       # Project-level commands
```

---

## 4. Database Schema Design (Key Entities)

### 4.1 Core Tables

```
Users
├── Id (UUID, PK)
├── Email
├── PhoneNumber
├── PasswordHash
├── FirstName / LastName
├── ProfileImageUrl
├── Role (Customer, Rider, Merchant, Admin)
├── Status (Active, Suspended, Deactivated)
├── EmailVerified / PhoneVerified
├── CreatedAt / UpdatedAt

RiderProfiles
├── Id (UUID, PK)
├── UserId (FK → Users)
├── VehicleType (Bicycle, Motorcycle, Car, OnFoot)
├── LicensePlate
├── IdDocumentUrl
├── SelfieUrl
├── BackgroundCheckStatus
├── ApprovalStatus (Pending, Approved, Rejected)
├── Rating (decimal)
├── TotalCompletedTasks
├── IsOnline
├── CurrentLatitude / CurrentLongitude
├── LastLocationUpdate
├── CreatedAt / UpdatedAt

Errands
├── Id (UUID, PK)
├── CustomerId (FK → Users)
├── RiderId (FK → Users, nullable)
├── Category (enum)
├── Status (enum)
├── Description
├── SpecialInstructions
├── Priority (Standard, Express, Scheduled)
├── ScheduledAt (nullable)
├── PickupAddress / PickupLat / PickupLng
├── DropoffAddress / DropoffLat / DropoffLng
├── EstimatedDistance (meters)
├── EstimatedDuration (seconds)
├── PackageSize (Small, Medium, Large, ExtraLarge)
├── PackageWeight
├── IsFragile
├── RequiresPhotoProof
├── RecipientName / RecipientPhone
├── PricingBreakdown (JSON)
├── TotalAmount
├── CommissionAmount
├── AcceptedAt / PickedUpAt / DeliveredAt
├── CancelledAt / CancellationReason
├── CreatedAt / UpdatedAt

ErrandStatusHistory
├── Id (UUID, PK)
├── ErrandId (FK → Errands)
├── Status
├── Latitude / Longitude
├── Notes
├── ImageUrl (proof photos)
├── CreatedAt

ErrandStops (multi-stop support)
├── Id (UUID, PK)
├── ErrandId (FK → Errands)
├── StopOrder (int)
├── Address / Latitude / Longitude
├── ContactName / ContactPhone
├── Instructions
├── Status
├── ArrivedAt / CompletedAt

Payments
├── Id (UUID, PK)
├── ErrandId (FK → Errands)
├── PayerId (FK → Users)
├── Amount
├── Currency
├── PaymentMethod (Wallet, Card, MobileMoney, Cash)
├── PaymentGatewayRef
├── Status (Pending, Completed, Failed, Refunded)
├── CreatedAt

Wallets
├── Id (UUID, PK)
├── UserId (FK → Users)
├── Balance
├── Currency
├── CreatedAt / UpdatedAt

WalletTransactions
├── Id (UUID, PK)
├── WalletId (FK → Wallets)
├── Type (Credit, Debit)
├── Amount
├── BalanceAfter
├── Source (TopUp, ErrandPayment, ErrandEarning, Refund, Tip, Bonus, Withdrawal)
├── ReferenceId
├── Description
├── CreatedAt

Reviews
├── Id (UUID, PK)
├── ErrandId (FK → Errands)
├── ReviewerId (FK → Users)
├── RevieweeId (FK → Users)
├── Rating (1-5)
├── Comment
├── CreatedAt

ChatMessages
├── Id (UUID, PK)
├── ErrandId (FK → Errands)
├── SenderId (FK → Users)
├── Message
├── MessageType (Text, Image, Location, System)
├── IsRead
├── CreatedAt

Merchants
├── Id (UUID, PK)
├── UserId (FK → Users)
├── BusinessName
├── BusinessAddress / Lat / Lng
├── LogoUrl
├── Category
├── IsVerified
├── OperatingHours (JSON)
├── CreatedAt / UpdatedAt

Products
├── Id (UUID, PK)
├── MerchantId (FK → Merchants)
├── Name / Description
├── Price
├── ImageUrls (JSON)
├── Category
├── InStock
├── CreatedAt / UpdatedAt

Notifications
├── Id (UUID, PK)
├── UserId (FK → Users)
├── Title / Body
├── Type (enum)
├── Data (JSON — deep link info)
├── IsRead
├── CreatedAt

PromoCodes
├── Id (UUID, PK)
├── Code (unique)
├── DiscountType (Percentage, FlatAmount)
├── DiscountValue
├── MaxDiscount
├── MinOrderAmount
├── UsageLimit / UsedCount
├── ExpiresAt
├── IsActive
├── CreatedAt

UserAddresses
├── Id (UUID, PK)
├── UserId (FK → Users)
├── Label (Home, Work, Custom)
├── Address / Latitude / Longitude
├── IsDefault
├── CreatedAt

RiderLocations (time-series / hot table)
├── Id (long, PK)
├── RiderId (FK → Users)
├── Latitude / Longitude
├── Heading / Speed
├── RecordedAt

SupportTickets
├── Id (UUID, PK)
├── UserId (FK → Users)
├── ErrandId (FK → Errands, nullable)
├── Subject / Description
├── Status (Open, InProgress, Resolved, Closed)
├── Priority (Low, Medium, High, Critical)
├── AssignedAgentId (FK → Users, nullable)
├── CreatedAt / UpdatedAt / ResolvedAt
```

---

## 5. API Design

### 5.1 API Versioning

- URL-based versioning: `/api/v1/...`
- All APIs return consistent response envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8
  }
}
```

### 5.2 Key API Endpoints

```
Authentication
  POST   /api/v1/auth/register
  POST   /api/v1/auth/login
  POST   /api/v1/auth/refresh-token
  POST   /api/v1/auth/forgot-password
  POST   /api/v1/auth/verify-otp
  POST   /api/v1/auth/social-login
  DELETE /api/v1/auth/logout

Users
  GET    /api/v1/users/me
  PUT    /api/v1/users/me
  PATCH  /api/v1/users/me/avatar
  GET    /api/v1/users/me/addresses
  POST   /api/v1/users/me/addresses
  PUT    /api/v1/users/me/addresses/{id}
  DELETE /api/v1/users/me/addresses/{id}

Errands
  POST   /api/v1/errands                     # Create errand
  GET    /api/v1/errands                     # List user's errands
  GET    /api/v1/errands/{id}                # Get errand details
  PATCH  /api/v1/errands/{id}/cancel         # Cancel errand
  GET    /api/v1/errands/{id}/tracking       # Get live tracking data
  GET    /api/v1/errands/{id}/status-history # Get status timeline
  POST   /api/v1/errands/{id}/review         # Submit review
  GET    /api/v1/errands/estimate            # Get price estimate

Errand Categories
  GET    /api/v1/categories                  # List categories

Rider
  PUT    /api/v1/rider/status                # Go online/offline
  GET    /api/v1/rider/tasks                 # Available/active tasks
  POST   /api/v1/rider/tasks/{id}/accept     # Accept task
  POST   /api/v1/rider/tasks/{id}/reject     # Reject task
  PATCH  /api/v1/rider/tasks/{id}/status     # Update task status
  POST   /api/v1/rider/tasks/{id}/proof      # Upload delivery proof
  POST   /api/v1/rider/location              # Update location (batch)
  GET    /api/v1/rider/earnings              # Earnings summary
  GET    /api/v1/rider/earnings/history      # Earnings history

Payments
  POST   /api/v1/payments/wallet/topup       # Top-up wallet
  GET    /api/v1/payments/wallet             # Get wallet balance
  GET    /api/v1/payments/wallet/transactions # Transaction history
  POST   /api/v1/payments/wallet/withdraw    # Withdraw to bank
  GET    /api/v1/payments/methods            # List payment methods
  POST   /api/v1/payments/methods            # Add payment method

Chat
  GET    /api/v1/errands/{id}/messages       # Get chat messages
  POST   /api/v1/errands/{id}/messages       # Send message

Merchants
  GET    /api/v1/merchants                   # List merchants
  GET    /api/v1/merchants/{id}              # Merchant details
  GET    /api/v1/merchants/{id}/products     # Merchant products
  POST   /api/v1/merchants/products          # Add product (merchant)
  PUT    /api/v1/merchants/products/{id}     # Update product
  DELETE /api/v1/merchants/products/{id}     # Delete product
  GET    /api/v1/merchants/orders            # Merchant's orders

Notifications
  GET    /api/v1/notifications               # List notifications
  PATCH  /api/v1/notifications/{id}/read     # Mark as read
  PATCH  /api/v1/notifications/read-all      # Mark all as read
  PUT    /api/v1/notifications/preferences   # Update preferences

Promotions
  POST   /api/v1/promotions/validate         # Validate promo code
  GET    /api/v1/promotions/active           # Active promotions

Admin
  GET    /api/v1/admin/users                 # List all users
  GET    /api/v1/admin/users/{id}            # User details
  PATCH  /api/v1/admin/users/{id}/status     # Suspend/activate
  GET    /api/v1/admin/riders/pending        # Pending rider approvals
  PATCH  /api/v1/admin/riders/{id}/approve   # Approve/reject rider
  GET    /api/v1/admin/errands               # All errands
  PATCH  /api/v1/admin/errands/{id}/assign   # Manual assignment
  GET    /api/v1/admin/analytics/overview    # Dashboard metrics
  GET    /api/v1/admin/analytics/revenue     # Revenue data
  GET    /api/v1/admin/analytics/errand-volume # Volume data
  PUT    /api/v1/admin/pricing               # Update pricing rules
  POST   /api/v1/admin/promotions            # Create promotion
  GET    /api/v1/admin/support/tickets       # Support tickets

SignalR Hubs
  /hubs/tracking     # Real-time location & status updates
  /hubs/chat         # Real-time chat messages
  /hubs/notifications # Real-time notification delivery
  /hubs/admin        # Admin dashboard real-time updates
```

---

## 6. Development Phases

### Phase 0: Foundation & Setup (Weeks 1–2)

| Task                 | Details                                                                                   | Duration |
| -------------------- | ----------------------------------------------------------------------------------------- | -------- |
| Repository setup     | Monorepo structure, .gitignore, README                                                    | 1 day    |
| Backend scaffolding  | .NET 8 solution with project structure (Api, Application, Domain, Infrastructure, Shared) | 2 days   |
| Database setup       | PostgreSQL + EF Core setup, initial migrations                                            | 1 day    |
| Docker environment   | docker-compose with PostgreSQL, Redis, RabbitMQ                                           | 1 day    |
| CI/CD pipeline       | GitHub Actions for build, test, lint                                                      | 1 day    |
| Web project setup    | Next.js 14, Tailwind, shadcn/ui, ESLint, Prettier                                         | 1 day    |
| Mobile project setup | Expo monorepo (user + rider apps), shared packages                                        | 1 day    |
| API documentation    | Swagger/Scalar setup, API conventions doc                                                 | 1 day    |
| Dev tooling          | Makefile, environment configs, seed scripts                                               | 1 day    |

**Deliverables:**

- All three projects bootstrapped and buildable
- Docker dev environment running
- CI pipeline green
- Empty but structured codebase

---

### Phase 1: Authentication & User Core (Weeks 3–5)

| Task                     | Details                                         | Duration |
| ------------------------ | ----------------------------------------------- | -------- |
| **Backend**              |                                                 |          |
| User entity & migration  | Users table with all fields                     | 0.5 day  |
| Registration API         | Email/phone registration with OTP               | 1.5 days |
| Login API                | JWT + refresh token flow                        | 1 day    |
| Social auth              | Google + Apple OAuth integration                | 1.5 days |
| Profile management API   | CRUD profile, avatar upload                     | 1 day    |
| Address book API         | CRUD saved addresses                            | 0.5 day  |
| Role-based authorization | Policy-based auth with role claims              | 0.5 day  |
| **Web Dashboard**        |                                                 |          |
| Auth pages               | Login, register, forgot password UI             | 1.5 days |
| Dashboard layout         | Sidebar nav, header, breadcrumbs                | 1 day    |
| User management pages    | List, detail, search, filter, suspend           | 2 days   |
| **Mobile (Shared)**      |                                                 |          |
| Auth screens             | Login, register, OTP verification UI            | 2 days   |
| Onboarding flow          | Welcome slides, permissions request             | 1 day    |
| Profile screens          | View/edit profile, avatar                       | 1 day    |
| Address management       | Add/edit/delete saved addresses                 | 1 day    |
| Auth state management    | Token storage, refresh, logout                  | 1 day    |
| API client setup         | Axios/Ky instance, interceptors, error handling | 0.5 day  |

**Deliverables:**

- Users can register, log in, manage profiles
- Admin can view/manage users
- Auth flow complete across all platforms

---

### Phase 2: Errand Core (Weeks 6–9)

| Task                      | Details                                                             | Duration |
| ------------------------- | ------------------------------------------------------------------- | -------- |
| **Backend**               |                                                                     |          |
| Errand entity & migration | Errands, ErrandStatusHistory, ErrandStops tables                    | 1 day    |
| Category system           | Errand categories configuration                                     | 0.5 day  |
| Create errand API         | Full errand creation with validation                                | 2 days   |
| Errand status machine     | State transitions with validation rules                             | 1.5 days |
| Price estimation API      | Distance calc, pricing rules engine                                 | 2 days   |
| Rider profile entity      | RiderProfiles table, KYC fields                                     | 0.5 day  |
| Rider onboarding API      | Document upload, approval workflow                                  | 1.5 days |
| Rider location API        | Batch location updates, Redis geo caching                           | 1.5 days |
| Matching engine           | Proximity + availability + vehicle matching                         | 3 days   |
| Dispatch system           | Broadcast/sequential offer with timeouts                            | 2 days   |
| Errand lifecycle events   | MassTransit events for status changes                               | 1 day    |
| **Web Dashboard**         |                                                                     |          |
| Errand list & detail      | List, filter, detail view with timeline                             | 2 days   |
| Rider approval queue      | Pending riders, doc review, approve/reject                          | 1.5 days |
| Live errand map           | Map view showing active errands + riders                            | 2 days   |
| **User App**              |                                                                     |          |
| Home screen               | Category grid, quick actions, recent errands                        | 1.5 days |
| Map picker                | Interactive map for pickup/dropoff selection                        | 2 days   |
| Errand request flow       | Multi-step form: category → locations → details → pricing → confirm | 3 days   |
| My errands list           | List with status badges, pull-to-refresh                            | 1 day    |
| Errand detail             | Status timeline, errand info                                        | 1 day    |
| **Rider App**             |                                                                     |          |
| Onboarding screens        | KYC document upload, selfie, vehicle info                           | 2 days   |
| Online/offline toggle     | Status toggle with location tracking                                | 1 day    |
| Incoming request UI       | Overlay card with accept/reject + timer                             | 1.5 days |
| Active task screen        | Task details, navigation, status update buttons                     | 2 days   |
| Task history              | Completed tasks list                                                | 0.5 day  |

**Deliverables:**

- Complete errand request → matching → acceptance → completion flow
- Rider onboarding and approval
- Basic pricing engine
- Admin errand monitoring

---

### Phase 3: Real-Time Tracking & Communication (Weeks 10–12)

| Task                        | Details                                    | Duration |
| --------------------------- | ------------------------------------------ | -------- |
| **Backend**                 |                                            |          |
| SignalR hub — Tracking      | Real-time location broadcast to customer   | 2 days   |
| SignalR hub — Chat          | Errand-scoped real-time messaging          | 1.5 days |
| SignalR hub — Notifications | Real-time push to connected clients        | 1 day    |
| Location recording service  | Store rider GPS trail (RiderLocations)     | 0.5 day  |
| ETA calculation             | Dynamic ETA based on route + traffic       | 1.5 days |
| Geofence service            | Detect arrival at pickup/dropoff           | 1 day    |
| Chat persistence            | ChatMessages table, message history API    | 0.5 day  |
| **Web Dashboard**           |                                            |          |
| Live tracking map           | Real-time rider dots on admin map          | 1.5 days |
| Real-time dashboard updates | SignalR for live metric updates            | 1 day    |
| **User App**                |                                            |          |
| Live tracking screen        | Map with rider marker, animated route, ETA | 2 days   |
| Status update toasts        | Real-time status change notifications      | 0.5 day  |
| Chat screen                 | Errand chat with rider (text + images)     | 1.5 days |
| Share trip                  | Share tracking link with contacts          | 0.5 day  |
| **Rider App**               |                                            |          |
| Background location service | Continuous GPS tracking while online       | 1.5 days |
| Turn-by-turn navigation     | Deep link to Google Maps / Waze            | 0.5 day  |
| Chat with customer          | Chat screen (same as user app)             | 1 day    |
| Photo proof capture         | Camera capture for pickup/delivery proof   | 1 day    |
| Signature capture           | Digital signature on delivery              | 0.5 day  |

**Deliverables:**

- Real-time rider tracking on map
- In-app chat between customer and rider
- Photo/signature proof of delivery
- Admin live monitoring

---

### Phase 4: Payments & Wallet (Weeks 13–16)

| Task                        | Details                                                 | Duration |
| --------------------------- | ------------------------------------------------------- | -------- |
| **Backend**                 |                                                         |          |
| Wallet system               | Wallets + WalletTransactions tables, balance management | 2 days   |
| Payment gateway integration | Stripe/Paystack integration for card payments           | 2.5 days |
| Mobile money integration    | MTN MoMo / Airtel Money API                             | 2 days   |
| Wallet top-up flow          | Card/mobile money → wallet credit                       | 1 day    |
| Errand payment processing   | Hold → charge → rider payout flow                       | 2 days   |
| Commission calculation      | Platform commission per errand                          | 0.5 day  |
| Rider payout system         | Scheduled payouts via Hangfire                          | 2 days   |
| Promo code system           | PromoCodes table, validation, application               | 1.5 days |
| Refund system               | Refund to wallet or original payment method             | 1 day    |
| Tip system                  | Post-delivery tip to rider                              | 0.5 day  |
| Cash payment handling       | Cash reconciliation workflow                            | 1 day    |
| Invoice generation          | PDF invoice per transaction                             | 1 day    |
| **Web Dashboard**           |                                                         |          |
| Financial dashboard         | Revenue, commission, payouts overview                   | 2 days   |
| Transaction management      | Searchable transaction list                             | 1 day    |
| Payout management           | Rider payout approval/review                            | 1 day    |
| Promo code management       | CRUD promo codes with rules                             | 1 day    |
| **User App**                |                                                         |          |
| Wallet screen               | Balance, top-up, transaction history                    | 1.5 days |
| Payment method selection    | Card, wallet, mobile money, cash options                | 1 day    |
| Add payment method          | Card input, mobile money linking                        | 1.5 days |
| Tip screen                  | Post-delivery tip prompt                                | 0.5 day  |
| **Rider App**               |                                                         |          |
| Earnings dashboard          | Today's earnings, weekly summary, chart                 | 1.5 days |
| Earnings history            | Detailed earnings list with filters                     | 1 day    |
| Withdrawal screen           | Request withdrawal to bank/mobile money                 | 1 day    |
| Cash collection summary     | Cash collected vs to remit                              | 0.5 day  |

**Deliverables:**

- Full payment flow (card, mobile money, wallet, cash)
- Wallet with top-up and withdrawal
- Rider earnings and payouts
- Promo codes
- Admin financial management

---

### Phase 5: Notifications & Ratings (Weeks 17–19)

| Task                       | Details                                     | Duration |
| -------------------------- | ------------------------------------------- | -------- |
| **Backend**                |                                             |          |
| Push notification service  | FCM + APNs via Firebase Admin SDK           | 1.5 days |
| SMS notification service   | Twilio / Africa's Talking integration       | 1 day    |
| Email notification service | SendGrid integration with templates         | 1 day    |
| Notification preferences   | User preference storage & filtering         | 0.5 day  |
| Notification events        | Event-driven notifications via MassTransit  | 1 day    |
| Rating system              | Reviews table, aggregate rating calculation | 1 day    |
| Rating impact logic        | Rider deactivation, priority matching       | 0.5 day  |
| **Web Dashboard**          |                                             |          |
| Notification broadcasting  | Send push/email to user segments            | 1 day    |
| Notification templates     | Manage notification templates               | 1 day    |
| Review moderation          | Review list, flag/remove inappropriate      | 1 day    |
| **User App**               |                                             |          |
| Notification center        | In-app notifications list                   | 1 day    |
| Push notification handling | FCM setup, deep linking                     | 1 day    |
| Rating flow                | Post-delivery rating (stars + comment)      | 1 day    |
| Notification preferences   | Settings screen for notification types      | 0.5 day  |
| **Rider App**              |                                             |          |
| Push notification handling | Incoming task alerts, status updates        | 1 day    |
| Audio alert for new tasks  | Sound notification for new requests         | 0.5 day  |
| Rating display             | View own rating and reviews                 | 0.5 day  |

**Deliverables:**

- Multi-channel notifications (push, SMS, email)
- Rating and review system
- Notification preferences
- Admin notification management

---

### Phase 6: Merchant Features (Weeks 20–23)

| Task                        | Details                                                               | Duration |
| --------------------------- | --------------------------------------------------------------------- | -------- |
| **Backend**                 |                                                                       |          |
| Merchant entity & migration | Merchants, Products tables                                            | 1 day    |
| Merchant registration API   | Business registration + verification                                  | 1 day    |
| Product catalog API         | CRUD products with images, categories, inventory                      | 2 days   |
| Merchant order flow         | Customer order → merchant accepts → ready for pickup → rider assigned | 2 days   |
| Merchant analytics API      | Revenue, order volume, popular products                               | 1 day    |
| Webhook system              | Notify merchant systems of order events                               | 1.5 days |
| **Web Dashboard**           |                                                                       |          |
| Merchant portal layout      | Separate merchant dashboard layout                                    | 1 day    |
| Store management            | Business profile, hours, logo                                         | 1 day    |
| Product management          | Product CRUD with image upload, variants                              | 2 days   |
| Order management            | Incoming orders, accept/reject, status                                | 2 days   |
| Merchant analytics          | Revenue charts, popular items, order trends                           | 1.5 days |
| Merchant admin views        | Admin: merchant list, verification, management                        | 1.5 days |
| **User App**                |                                                                       |          |
| Merchant browse             | List nearby merchants by category                                     | 1 day    |
| Merchant store page         | Store info, product grid                                              | 1 day    |
| Product detail & cart       | Add to cart, quantity, notes                                          | 1.5 days |
| Merchant order checkout     | Cart → delivery details → payment → confirm                           | 1 day    |

**Deliverables:**

- Merchant self-service portal
- Product catalog with inventory
- Merchant order lifecycle
- Customer can browse and order from merchants
- Admin merchant management

---

### Phase 7: Advanced Features (Weeks 24–27)

| Task                  | Details                                           | Duration |
| --------------------- | ------------------------------------------------- | -------- |
| **Backend**           |                                                   |          |
| Recurring errands     | Cron-based recurring errand creation via Hangfire | 1.5 days |
| Multi-stop errands    | Multi-stop routing, pricing, status per stop      | 2 days   |
| Loyalty program       | Points accumulation, tier calculation, redemption | 2 days   |
| Referral system       | Referral codes, tracking, bonus distribution      | 1 day    |
| Surge pricing engine  | Demand-zone-based surge multiplier                | 1.5 days |
| Analytics aggregation | Scheduled analytics data aggregation jobs         | 1 day    |
| Fraud detection       | Velocity checks, suspicious pattern detection     | 1.5 days |
| SOS system            | Emergency alert to support + location share       | 1 day    |
| **Web Dashboard**     |                                                   |          |
| Advanced analytics    | Heat maps, funnel analysis, cohort charts         | 2 days   |
| Pricing configuration | Surge rules, zone pricing, simulation tool        | 2 days   |
| Loyalty program mgmt  | Tier config, points rules, member management      | 1 day    |
| System configuration  | Feature flags, app config, zone management        | 1.5 days |
| **User App**          |                                                   |          |
| Recurring errands     | Schedule management, edit recurrence              | 1 day    |
| Multi-stop flow       | Add/reorder stops in errand creation              | 1 day    |
| Loyalty screen        | Points balance, tier progress, rewards            | 1 day    |
| Referral screen       | Share code, track referrals                       | 0.5 day  |
| **Rider App**         |                                                   |          |
| Multi-stop navigation | Sequential stop navigation                        | 1 day    |
| Demand heat map       | View high-demand zones                            | 1 day    |
| Performance badges    | Achievement badges display                        | 0.5 day  |

**Deliverables:**

- Recurring and multi-stop errands
- Loyalty and referral programs
- Surge pricing
- Advanced analytics
- SOS/safety features

---

### Phase 8: Support, Polish & Optimization (Weeks 28–30)

| Task                     | Details                                          | Duration |
| ------------------------ | ------------------------------------------------ | -------- |
| **Backend**              |                                                  |          |
| Support ticket system    | SupportTickets table, CRUD API                   | 1.5 days |
| Chatbot integration      | FAQ-based auto-responses                         | 1 day    |
| API rate limiting tuning | Per-endpoint rate limits                         | 0.5 day  |
| Performance optimization | Query optimization, N+1 fixes, index tuning      | 2 days   |
| Caching layer            | Redis caching for hot paths                      | 1 day    |
| Load testing             | k6 / Artillery load test scripts                 | 1 day    |
| Security audit           | OWASP checklist, dependency scan, pen test prep  | 1 day    |
| **Web Dashboard**        |                                                  |          |
| Support ticket UI        | Ticket list, detail, agent assignment            | 1.5 days |
| Live chat support        | Agent-side live chat interface                   | 1 day    |
| Dashboard polish         | Loading states, error states, empty states       | 1 day    |
| Responsive optimization  | Tablet/mobile responsive fixes                   | 1 day    |
| Accessibility audit      | Screen reader, contrast, keyboard nav            | 0.5 day  |
| **Mobile (Both Apps)**   |                                                  |          |
| Help center              | FAQ, search, contact support                     | 1 day    |
| Chat support             | In-app chat with support agent                   | 1 day    |
| Offline handling         | Offline detection, queue actions, retry          | 1 day    |
| Performance optimization | List virtualization, image caching, memory leaks | 1.5 days |
| UI polish                | Animations, transitions, haptic feedback         | 1 day    |
| Dark mode                | Theme switching with system detection            | 1 day    |
| Accessibility            | Font scaling, screen reader labels               | 0.5 day  |
| App size optimization    | Bundle analysis, asset optimization              | 0.5 day  |

**Deliverables:**

- Customer support system
- Performance-optimized apps
- Dark mode
- Offline resilience
- Accessibility compliance

---

### Phase 9: Testing, QA & Launch Prep (Weeks 31–32)

| Task                      | Details                                  | Duration |
| ------------------------- | ---------------------------------------- | -------- |
| Integration testing       | End-to-end API integration tests         | 2 days   |
| Mobile E2E testing        | Detox test suites for critical flows     | 2 days   |
| Web E2E testing           | Playwright test suites for admin flows   | 1.5 days |
| UAT                       | User acceptance testing with test group  | 2 days   |
| Bug fixing                | Triage and fix UAT-discovered bugs       | 3 days   |
| App store preparation     | Screenshots, descriptions, metadata      | 1 day    |
| TestFlight / Play Console | Beta distribution setup                  | 0.5 day  |
| Production infrastructure | Production environment provisioning      | 1 day    |
| Monitoring setup          | Dashboards, alerts, on-call schedule     | 1 day    |
| Documentation             | API docs, runbooks, deployment guides    | 1 day    |
| Launch checklist          | Security, legal, compliance final checks | 0.5 day  |

**Deliverables:**

- Comprehensive test coverage
- Production environment ready
- App store submissions
- Operational runbooks
- Launch-ready product

---

## 7. Team Structure (Recommended)

| Role                           | Count | Responsibility                                 |
| ------------------------------ | ----- | ---------------------------------------------- |
| Backend Engineer (C#)          | 2     | API development, database, integrations        |
| Frontend Engineer (Next.js)    | 1     | Admin dashboard, merchant portal               |
| Mobile Engineer (React Native) | 2     | User app + Rider app                           |
| Full-Stack/DevOps              | 1     | CI/CD, infrastructure, deployment              |
| UI/UX Designer                 | 1     | Design system, screens, prototypes             |
| QA Engineer                    | 1     | Testing, automation, quality                   |
| Product Manager                | 1     | Requirements, prioritization, stakeholder mgmt |
| **Total**                      | **9** |                                                |

---

## 8. Infrastructure & Deployment

### 8.1 Development Environment

```
docker-compose.dev.yml:
  - PostgreSQL 16
  - Redis 7
  - RabbitMQ 3 (with management plugin)
  - Seq (structured log viewer)
  - MailHog (email testing)
  - MinIO (S3-compatible object storage)
```

### 8.2 Staging & Production (Cloud)

| Service        | Hosting Option                          | Purpose                             |
| -------------- | --------------------------------------- | ----------------------------------- |
| Backend API    | Azure App Service / AWS ECS / Railway   | .NET 8 API hosting                  |
| Web Dashboard  | Vercel                                  | Next.js hosting with edge functions |
| Database       | Azure Database for PostgreSQL / AWS RDS | Managed PostgreSQL                  |
| Cache          | Azure Cache for Redis / ElastiCache     | Managed Redis                       |
| Message Queue  | Azure Service Bus / Amazon MQ           | Managed message broker              |
| Object Storage | Azure Blob Storage / AWS S3             | File uploads                        |
| CDN            | Azure CDN / CloudFront                  | Static assets                       |
| Monitoring     | Application Insights / Datadog          | APM + monitoring                    |
| Error Tracking | Sentry                                  | Error reporting                     |
| CI/CD          | GitHub Actions                          | Build + deploy pipelines            |
| Mobile Builds  | EAS Build (Expo)                        | Cloud-based native builds           |
| Mobile Updates | EAS Update (Expo)                       | OTA JavaScript updates              |

### 8.3 Deployment Strategy

- **Backend:** Containerized with Docker, deployed via CI/CD to staging → production
- **Web:** Auto-deploy on merge to main via Vercel
- **Mobile:** EAS Build for store releases; EAS Update for JS-only hotfixes
- **Database:** Migrations applied via CI/CD with rollback support
- **Feature Flags:** LaunchDarkly or custom feature flag system for gradual rollouts

---

## 9. Risk Mitigation

| Risk                                       | Likelihood | Impact | Mitigation                                               |
| ------------------------------------------ | ---------- | ------ | -------------------------------------------------------- |
| Payment gateway integration issues         | Medium     | High   | Start integration early; implement fallback provider     |
| Real-time tracking battery drain           | High       | Medium | Adaptive location accuracy; background mode optimization |
| Map API costs at scale                     | Medium     | Medium | Cache geocoding results; use Mapbox (cheaper) vs Google  |
| Rider matching delays in low-density areas | High       | High   | Expand search radius; notification to wider rider pool   |
| Data privacy compliance                    | Medium     | High   | Privacy-by-design; legal review before launch            |
| App store rejection                        | Low        | High   | Follow guidelines strictly; pre-submission review        |
| Third-party API downtime                   | Medium     | Medium | Circuit breaker pattern; fallback providers              |
| Scope creep                                | High       | Medium | Strict phase boundaries; MVP-first approach              |

---

## 10. Success Metrics (KPIs)

| Metric                   | Target (Month 1) | Target (Month 6) |
| ------------------------ | ---------------- | ---------------- |
| Registered Users         | 5,000            | 50,000           |
| Active Riders            | 200              | 2,000            |
| Daily Errands            | 100              | 2,000            |
| Errand Completion Rate   | > 85%            | > 92%            |
| Average Delivery Time    | < 45 min         | < 35 min         |
| Customer Rating (avg)    | > 4.0            | > 4.3            |
| App Crash Rate           | < 1%             | < 0.5%           |
| API p95 Latency          | < 300ms          | < 200ms          |
| Customer Retention (30d) | > 30%            | > 50%            |

---

## 11. Post-Launch Roadmap

| Quarter        | Features                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------ |
| Q1 Post-Launch | Performance tuning, feedback-driven fixes, merchant growth, rider incentive programs       |
| Q2 Post-Launch | Corporate accounts, API marketplace, scheduled batch deliveries, inter-city delivery       |
| Q3 Post-Launch | AI-powered demand prediction, route optimization, chatbot support, driver scoring ML model |
| Q4 Post-Launch | Multi-country expansion, white-label SDK, partner API, advanced analytics & BI             |
