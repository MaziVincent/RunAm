# Redis And Seq Dev Setup

This project already ships Redis and Seq in the local Docker stack. This guide covers the exact local setup, how they are used now, and where Redis should be expanded next.

## Start The Local Infra

From the repo root:

```bash
make infra-up
```

That starts the local containers defined in [infra/docker/docker-compose.dev.yml](../infra/docker/docker-compose.dev.yml):

- PostgreSQL on `localhost:5434`
- Redis on `localhost:6380`
- RabbitMQ on `localhost:5672` and `localhost:15672`
- Seq ingestion on `localhost:5341`
- Seq UI on `http://localhost:8081`

The dev Seq container is configured with no authentication on first run so it can start cleanly in local Docker.

## Backend Env Setup

Create a local backend env file if you do not already have one:

```bash
cp backend/src/RunAm.Api/.env.example backend/src/RunAm.Api/.env
```

For Redis and Seq, these values should be present in `backend/src/RunAm.Api/.env`:

```env
REDIS_CONNECTION=localhost:6380
SEQ_SERVER_URL=http://localhost:5341
ASPNETCORE_URLS=http://localhost:5001
```

Then start the API:

```bash
make backend-run
```

## How Seq Is Used

Seq is the backend log store and viewer.

- Serilog is configured in [backend/src/RunAm.Api/Program.cs](../backend/src/RunAm.Api/Program.cs)
- Console logging stays enabled for terminal output
- Logs are also pushed to Seq using `WriteTo.Seq(...)`
- Request logging is enabled with `UseSerilogRequestLogging()`
- Regular `ILogger<T>` usage across controllers, middleware, and services flows into Seq

### Verify Seq Locally

1. Open `http://localhost:8081`
2. Start the backend with `make backend-run`
3. Hit any API endpoint, for example `GET /health`
4. Refresh Seq and confirm request logs appear

### What To Look For In Seq

- Unhandled exceptions from middleware
- Monnify webhook processing logs
- Email, SMS, push, and storage service failures
- Slow or noisy endpoints once traffic grows

### Useful Seq Filters

```text
@Level = 'Error'
```

```text
RequestPath like '/api/v1/%'
```

```text
SourceContext like '%Notification%'
```

## How Redis Is Used Now

Redis is now wired into two backend concerns:

- Health checks at `GET /health`
- Distributed caching for public service-category responses

The cache-backed handlers are in:

- [backend/src/RunAm.Application/ServiceCategories/Queries/GetServiceCategoriesQuery.cs](../backend/src/RunAm.Application/ServiceCategories/Queries/GetServiceCategoriesQuery.cs)
- [backend/src/RunAm.Application/ServiceCategories/Commands/ServiceCategoryCommands.cs](../backend/src/RunAm.Application/ServiceCategories/Commands/ServiceCategoryCommands.cs)

### Cached Keys

The app uses a Redis instance prefix of `runam:`. The current logical keys are:

- `service-categories:active`
- `service-categories:slug:{slug}`

That means Redis will store them with the effective prefix:

- `runam:service-categories:active`
- `runam:service-categories:slug:{slug}`

### Verify Redis Locally

After starting the backend and calling the service-category endpoints:

```bash
docker exec runam-redis redis-cli KEYS 'runam:*'
```

This project uses `localhost:6380` for Docker Redis in development to avoid collisions with host-level Redis services that often already bind `localhost:6379` on macOS.

You should see the service-category cache entries after calling:

```text
GET /api/v1/service-categories
GET /api/v1/service-categories/{slug}
```

To inspect a cached entry:

```bash
docker exec runam-redis redis-cli GET 'runam:service-categories:active'
```

### Cache Invalidation

The service-category cache is cleared automatically when an admin:

- creates a category
- updates a category
- deletes a category

That invalidation happens in the service-category command handlers.

## How To Use Redis In Development

Use Redis for data that is:

- read often
- cheap to serialize
- safe to serve slightly stale for a short TTL
- expensive to compute or query repeatedly

Keep Redis out of write-heavy transactional paths unless you also define invalidation rules clearly.

## Best Next Areas For Redis In This Backend

These are the best next candidates, ordered by value and implementation risk.

1. Vendor browse and vendor detail queries
   Public marketplace reads in [backend/src/RunAm.Application/Vendors/Queries/VendorQueries.cs](../backend/src/RunAm.Application/Vendors/Queries/VendorQueries.cs) are natural cache targets. Cache by filter set, page, and vendor ID with short TTLs and invalidate on vendor or product updates.

2. Product catalog and product-category reads
   Vendor storefront data is read far more than it is written. Cache public product-category trees and vendor product lists, then invalidate on product create, update, delete, availability toggle, and admin moderation changes.

3. Notification unread counts
   The unread badge endpoint is called frequently and is cheap to cache with a very short TTL. A stronger version is event-driven invalidation whenever notifications are created, marked read, or marked all read.

4. OTP and short-lived verification state
   Today OTP data is persisted in the database through [backend/src/RunAm.Infrastructure/Services/OtpService.cs](../backend/src/RunAm.Infrastructure/Services/OtpService.cs). Redis is a better fit for ephemeral OTP attempts, resend cooldowns, and brute-force throttling.

5. Rate limiting and abuse controls
   The app currently uses in-process rate limiting. If you run multiple API instances later, Redis should back auth throttling, resend-OTP throttling, and possibly webhook replay protection so limits are shared across nodes.

6. Nearby-rider and live-tracking transient state
   If rider locations or availability become more dynamic, Redis can hold hot geospatial or short-lived state for matching and tracking rather than pushing every update through PostgreSQL.

7. Price-estimate memoization
   The estimator in [backend/src/RunAm.Application/Errands/Queries/GetPriceEstimateQuery.cs](../backend/src/RunAm.Application/Errands/Queries/GetPriceEstimateQuery.cs) is simple today, but once live distance lookups or surge rules are added, short-lived cache entries for identical requests can reduce repeated work.

## Areas I Would Not Cache First

- wallet balances
- payment status transitions
- order creation results
- security-sensitive identity reads without a clear invalidation model

Those paths are correctness-sensitive and should stay strongly consistent until there is a specific design for cache coherence.
