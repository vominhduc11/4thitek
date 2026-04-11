#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────
#  restore.sh — Full-stack restore from a backup produced by backup.sh
#
#  USAGE:
#    ./restore.sh BACKUP_FOLDER
#
#  EXAMPLE:
#    ./restore.sh backups/20260316_140000
#
#  WHAT IT DOES:
#    Phase 1 — Validate backup files and checksums (before touching anything)
#    Phase 2 — Stop backend and minio (prevent writes during restore)
#    Phase 3 — Ensure postgres is running and ready (starts it if needed)
#    Phase 4 — Drop, recreate, and restore the PostgreSQL database
#    Phase 5 — Wipe and restore the MinIO data volume
#    Phase 6 — Restart minio and backend
#
#  WARNING: Phase 4 permanently replaces all current database data.
#           Run backup.sh first if you want a safety snapshot.
#
#  COMPOSE FILE: uses docker-compose.yaml in the current directory.
# ─────────────────────────────────────────────────────────────────

if [ -z "${1:-}" ]; then
  echo "Usage: ./restore.sh BACKUP_FOLDER"
  echo ""
  echo "Example:"
  echo "  ./restore.sh backups/20260316_140000"
  exit 1
fi

BACKUP_DIR="${1%/}"  # strip any trailing slash

# ─── Load .env ───────────────────────────────────────────────────
# Picks up POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, MINIO_VOLUME
# without hardcoding them in this script.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

POSTGRES_CONTAINER="postgres"
POSTGRES_DB="${POSTGRES_DB:-app_db}"
POSTGRES_USER="${POSTGRES_USER:-app}"
FLYWAY_IMAGE="${FLYWAY_IMAGE:-flyway/flyway:10.20.1}"

# ─── Detect MinIO data volume ────────────────────────────────────
# Override by setting MINIO_VOLUME in the environment or .env file.
if [ -z "${MINIO_VOLUME:-}" ]; then
  MINIO_VOLUME=$(docker volume ls --format '{{.Name}}' | grep '_minio-data$' | head -1)
  if [ -z "$MINIO_VOLUME" ]; then
    echo "ERROR: Could not find a Docker volume matching *_minio-data." >&2
    echo "       Set MINIO_VOLUME explicitly and re-run." >&2
    exit 1
  fi
fi

echo "===================================="
echo "Starting restore from: $BACKUP_DIR"
echo "PostgreSQL DB:  $POSTGRES_DB  (user: $POSTGRES_USER)"
echo "MinIO volume:   $MINIO_VOLUME"
echo "===================================="

# ─────────────────────────────────────────────────────────────────
# Helper: stop a service only if it is currently running.
# Skips silently if the service is already stopped or never started.
# ─────────────────────────────────────────────────────────────────
stop_if_running() {
  local service="$1"
  if docker compose ps "$service" 2>/dev/null | grep -qiE 'up|running'; then
    echo "  Stopping $service..."
    docker compose stop "$service"
  else
    echo "  $service is not running — nothing to stop."
  fi
}

# ─────────────────────────────────────────────────────────────────
# Helper: ensure a service is running.
# Uses 'up -d' (not 'start') so it also works on a fresh environment
# where the container has never been created.
# ─────────────────────────────────────────────────────────────────
ensure_running() {
  local service="$1"
  if docker compose ps "$service" 2>/dev/null | grep -qiE 'up|running'; then
    echo "  $service is already running."
  else
    echo "  $service is not running — starting it..."
    docker compose up -d "$service"
  fi
}

# ─────────────────────────────────────────────────────────────────
# Helper: resolve the Docker network used by the postgres service.
# This avoids guessing the Compose project name when we run the
# Flyway CLI in a one-off container against the restored database.
# ─────────────────────────────────────────────────────────────────
get_service_network() {
  local service="$1"
  local container_id

  container_id=$(docker compose ps -q "$service")
  if [ -z "$container_id" ]; then
    echo "ERROR: Could not resolve container id for service: $service" >&2
    return 1
  fi

  docker inspect -f '{{range $name, $cfg := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$container_id" \
    | head -1
}

# ─────────────────────────────────────────────────────────────────
# Helper: repair Flyway schema history checksums against the current
# migration files in this workspace. This is needed when a backup was
# taken before historical SQL migrations were edited in git.
# ─────────────────────────────────────────────────────────────────
repair_flyway_history() {
  local migrations_dir network_name

  migrations_dir="$(cd backend/src/main/resources/db/migration && pwd)"
  network_name="$(get_service_network "$POSTGRES_CONTAINER")"

  if [ -z "$network_name" ]; then
    echo "ERROR: Could not determine the Docker network for $POSTGRES_CONTAINER." >&2
    return 1
  fi

  echo "  Repairing Flyway schema history against current migration files..."
  docker run --rm \
    --network "$network_name" \
    -v "$migrations_dir:/flyway/sql:ro" \
    "$FLYWAY_IMAGE" \
    -url="jdbc:postgresql://postgres:5432/$POSTGRES_DB" \
    -user="$POSTGRES_USER" \
    -password="$POSTGRES_PASSWORD" \
    -locations="filesystem:/flyway/sql" \
    repair
}

# ─────────────────────────────────────────────────────────────────
# Helper: wait for PostgreSQL to accept connections.
# Polls pg_isready up to MAX_WAIT seconds before giving up.
# ─────────────────────────────────────────────────────────────────
wait_for_postgres() {
  local max_wait=60
  local interval=2
  local waited=0

  echo "  Waiting for PostgreSQL to be ready (up to ${max_wait}s)..."
  while [ "$waited" -lt "$max_wait" ]; do
    if docker compose exec -T "$POSTGRES_CONTAINER" \
        pg_isready -U "$POSTGRES_USER" -d postgres -q 2>/dev/null; then
      echo "  PostgreSQL is ready."
      return 0
    fi
    sleep "$interval"
    waited=$((waited + interval))
    echo "  Still waiting... (${waited}s elapsed)"
  done

  echo "" >&2
  echo "ERROR: PostgreSQL did not become ready within ${max_wait}s." >&2
  echo "       Check logs: docker compose logs $POSTGRES_CONTAINER" >&2
  return 1
}

# ═════════════════════════════════════════════════════════════════
# Phase 1 — Pre-flight: validate backup files and checksums
#
# All checks run before any service is stopped or any data is
# modified. A failed check here is completely safe to retry.
# ═════════════════════════════════════════════════════════════════
echo ""
echo "--- Phase 1: pre-flight checks ---"

PG_ARCHIVE="$BACKUP_DIR/postgres.sql.gz"
MINIO_ARCHIVE="$BACKUP_DIR/minio.tar.gz"

for f in "$PG_ARCHIVE" "$MINIO_ARCHIVE"; do
  if [ ! -f "$f" ]; then
    echo "ERROR: Backup file not found: $f" >&2
    exit 1
  fi
  if [ ! -s "$f" ]; then
    echo "ERROR: Backup file is empty: $f" >&2
    exit 1
  fi
done

# Checksum verification — a mismatch means the backup is corrupt or
# was truncated in transit. Hard-stop before touching any live data.
for f in "$PG_ARCHIVE" "$MINIO_ARCHIVE"; do
  checksum_file="${f}.sha256"
  if [ -f "$checksum_file" ]; then
    echo "  Verifying checksum: $(basename "$checksum_file")"
    # sha256sum --check reads the stored hash and re-hashes the file;
    # exits non-zero (caught by set -e) if hashes do not match.
    sha256sum --check "$checksum_file"
  else
    echo "  WARNING: No checksum file for $(basename "$f") — skipping integrity check"
  fi
done

# Resolve absolute path now; needed for the Docker volume mount in Phase 5.
BACKUP_ABS=$(cd "$BACKUP_DIR" && pwd)

echo "  Pre-flight checks passed."

# ═════════════════════════════════════════════════════════════════
# Phase 2 — Stop dependent services
#
# backend must be stopped before the DB is wiped to prevent it from
# writing new data (transactions, cache flushes) between dropdb and
# the restore completing. minio must be stopped before the volume is
# cleared to avoid partial-write corruption.
# ═════════════════════════════════════════════════════════════════
echo ""
echo "--- Phase 2: stopping dependent services ---"

stop_if_running "backend"
stop_if_running "minio"

# Hard check: neither service must be running before we touch any data.
if docker compose ps backend minio 2>/dev/null | grep -qiE 'up|running'; then
  echo "ERROR: backend or minio did not stop cleanly." >&2
  echo "       Aborting to protect live data." >&2
  exit 1
fi

echo "  Dependent services are down."

# ═════════════════════════════════════════════════════════════════
# Phase 3 — Ensure PostgreSQL is running and ready
#
# postgres is kept running (or started if it was stopped) because
# we need it to execute dropdb / createdb / psql restore.
# If it was never started, 'docker compose up -d postgres' creates
# and starts it from scratch.
# ═════════════════════════════════════════════════════════════════
echo ""
echo "--- Phase 3: ensuring PostgreSQL is running ---"

ensure_running "$POSTGRES_CONTAINER"
wait_for_postgres

# ═════════════════════════════════════════════════════════════════
# Phase 4 — Restore PostgreSQL
# ═════════════════════════════════════════════════════════════════
echo ""
echo "--- Phase 4: restoring PostgreSQL ---"

# Terminate any lingering connections (e.g., pgAdmin, monitoring tools)
# so that dropdb can acquire an exclusive lock. Suppress output — the
# row count is not meaningful here; errors still surface via stderr.
docker compose exec -T "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
  > /dev/null

# --if-exists handles a fresh postgres volume where the DB does not
# exist yet (e.g., restoring onto a newly provisioned server).
docker compose exec -T "$POSTGRES_CONTAINER" \
  dropdb --if-exists -U "$POSTGRES_USER" "$POSTGRES_DB"

docker compose exec -T "$POSTGRES_CONTAINER" \
  createdb -U "$POSTGRES_USER" "$POSTGRES_DB"

echo "  Streaming backup into PostgreSQL (this may take a while)..."
gunzip -c "$PG_ARCHIVE" \
  | docker compose exec -T "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" "$POSTGRES_DB"

echo "  PostgreSQL restore completed."

# ═════════════════════════════════════════════════════════════════
# Phase 5 — Repair Flyway history against current migrations
#
# Restoring a backup can reintroduce schema history checksums from an
# older revision of the repo. Repair aligns those checksums with the
# SQL files currently present locally so backend startup can validate
# and then apply any still-pending migrations.
# ═════════════════════════════════════════════════════════════════
echo ""
echo "--- Phase 5: repairing Flyway schema history ---"

repair_flyway_history

echo "  Flyway schema history repair completed."

# ═════════════════════════════════════════════════════════════════
# Phase 6 — Restore MinIO data volume
#
# minio is confirmed stopped (Phase 2). The volume is wiped and the
# backup archive is extracted. The bucket policy set by minio-init
# is embedded in the volume and will be restored automatically.
# ═════════════════════════════════════════════════════════════════
echo ""
echo "--- Phase 6: restoring MinIO data ---"

docker run --rm \
  -v "$MINIO_VOLUME:/data" \
  -v "$BACKUP_ABS:/backup:ro" \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/minio.tar.gz -C /data"

echo "  MinIO data restore completed."

# ═════════════════════════════════════════════════════════════════
# Phase 7 — Restart services
# ═════════════════════════════════════════════════════════════════
echo ""
echo "--- Phase 7: starting services ---"

docker compose start minio backend

echo ""
echo "Post-restore service status:"
docker compose ps "$POSTGRES_CONTAINER" minio backend

echo ""
echo "===================================="
echo "Restore finished."
echo ""
echo "Next steps:"
echo "  Verify health:  docker compose ps"
echo "  Backend logs:   docker compose logs --tail=50 backend"
echo "  Minio logs:     docker compose logs --tail=20 minio"
echo "===================================="
