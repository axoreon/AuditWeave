# Database migrations

Run migration commands from the repository root unless a command explicitly
changes into `backend`.

## Create a migration

```bash
python scripts/create_migration.py "add contact requests"
```

The helper runs Alembic autogenerate and renames only the newly created file.
Existing Alembic revision IDs and `down_revision` metadata are not changed.
With the eight legacy migrations currently in the repository, the example
creates:

```text
backend/migrations/versions/0009_add_contact_requests.py
```

Preview the next filename without connecting to the database:

```bash
python scripts/create_migration.py --dry-run "add contact requests"
```

Always inspect the generated `upgrade()` and `downgrade()` functions.
Autogenerate is a starting point, not a substitute for review.

## Apply migrations

```bash
cd backend
python -m alembic upgrade head
```

## Check the current revision

```bash
cd backend
python -m alembic current
```

To inspect repository heads without connecting to the database:

```bash
cd backend
python -m alembic heads
```

## Downgrade one revision

```bash
cd backend
python -m alembic downgrade -1
```

Confirm the downgrade is safe and backed up before running it against shared
or production data.

## Rules

- Every schema change must have a migration committed to Git and reviewed in a pull request.
- Never edit a production database schema manually.
- Never delete an already-applied migration.
- Never change a deployed migration's `revision` or `down_revision`.
- Use the `NNNN_short_description.py` filename convention for every new migration.
- Keep migrations deterministic; do not depend on local files, current time, or external services.
- Provide a practical downgrade when the operation can be reversed safely.
- Separate risky or long-running data migrations from schema changes when appropriate.
- Make destructive changes explicit and include a backup and rollout plan.
- Resolve multiple Alembic heads with an intentional reviewed merge before adding more migrations.
