# Database migrations

RunAm uses Entity Framework Core 8 migrations with PostgreSQL. Migration source
files and the model snapshot are stored together in:

```text
backend/src/RunAm.Infrastructure/Migrations
```

## Local development

Start PostgreSQL and the other development services:

```bash
make infra-up
```

Apply all pending migrations:

```bash
make db-migrate
```

Create a migration:

```bash
make db-migration-add NAME=DescribeTheChange
```

The API also applies pending migrations and runs the development data seeder
when it starts in the `Development` environment. EF design-time commands are
excluded from that startup behavior.

## Connection-string precedence

Database configuration is resolved in this order:

1. `DATABASE_URL`
2. A complete set of `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`,
   `DATABASE_USER`, and `DATABASE_PASSWORD`
3. The standard .NET `ConnectionStrings:DefaultConnection` setting, including
   `ConnectionStrings__DefaultConnection`

Partial `DATABASE_*` configuration fails immediately with a list of missing
variables. Local `.env` values never overwrite variables supplied by CI,
containers, or the hosting platform.

## CI regression validation

The backend CI workflow uses a clean PostgreSQL service and:

1. Fails when the EF model has changes not represented by a migration.
2. Applies the complete migration chain to an empty database.
3. Rolls the database back to migration `0`.
4. Reapplies the complete chain.
5. Generates and uploads an idempotent SQL migration artifact.

This validates both every `Up` method and every `Down` method on each backend
change.

## Production

Production migrations are intentionally separate from API startup. To apply
them:

1. Create a GitHub environment named `production`.
2. Add its protected `DATABASE_URL` secret.
3. Configure required reviewers for that environment.
4. Run the **Production Database Migration** workflow from GitHub Actions.

The workflow serializes migration runs, checks for model drift, uploads the
exact idempotent SQL script as an audit artifact, and then applies pending
migrations. Take a database backup before approving migrations that contain
destructive operations.

## Production administrator bootstrap

The development demo-data seeder never runs in production. The required
Identity roles and a production admin can instead be created through the
separate, opt-in startup bootstrap.

Configure the Cloud Run revision with:

```text
ADMIN_SEED_ENABLED=true
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=<Secret Manager reference>
ADMIN_SEED_FIRST_NAME=System
ADMIN_SEED_LAST_NAME=Admin
```

Apply database migrations before deploying the enabled revision. The bootstrap
is idempotent and protected by a PostgreSQL transaction-level advisory lock, so
concurrent Cloud Run instances cannot create duplicate administrators. It will
not reset the password of an existing admin and refuses to promote an existing
non-admin account.

After the account has been created and login has been verified, deploy another
revision with `ADMIN_SEED_ENABLED=false` and remove the password secret from the
service. The administrator remains in the database.

The same operation can be run once from a controlled environment or Cloud Run
Job using:

```bash
make db-seed-admin
```

This command requires the same `ADMIN_SEED_*` configuration and exits after the
admin bootstrap instead of starting the API server.
