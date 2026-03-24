#!/bin/bash
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: ./restore.sh BACKUP_FOLDER"
  echo "Example:"
  echo "  ./restore.sh backups/20260316_140000"
  exit 1
fi

BACKUP_DIR="${1%/}"  # strip any trailing slash

# Load .env if present so POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD
# are picked up automatically without hardcoding them here.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

POSTGRES_CONTAINER="postgres"
POSTGRES_DB="${POSTGRES_DB:-app_db}"
POSTGRES_USER="${POSTGRES_USER:-app}"

# Detect MinIO data volume dynamically.
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

#################################
# Pre-flight checks
#################################

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

# Verify SHA-256 checksums when present.
for f in "$PG_ARCHIVE" "$MINIO_ARCHIVE"; do
  checksum_file="${f}.sha256"
  if [ -f "$checksum_file" ]; then
    echo "Verifying checksum: $(basename "$checksum_file")"
    sha256sum --check "$checksum_file"
  else
    echo "WARNING: No checksum file for $(basename "$f") — skipping integrity check"
  fi
done

# PostgreSQL container must be running for the DB restore.
if ! docker compose ps "$POSTGRES_CONTAINER" | grep -qiE 'up|running'; then
  echo "ERROR: PostgreSQL container '$POSTGRES_CONTAINER' is not running." >&2
  exit 1
fi

# Resolve absolute path now (needed for Docker volume mount later).
BACKUP_ABS=$(cd "$BACKUP_DIR" && pwd)

#################################
# Restore PostgreSQL
#################################

echo "Restoring PostgreSQL..."

# Terminate active connections so dropdb succeeds.
docker compose exec -T "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();"

docker compose exec -T "$POSTGRES_CONTAINER" dropdb -U "$POSTGRES_USER" "$POSTGRES_DB"
docker compose exec -T "$POSTGRES_CONTAINER" createdb -U "$POSTGRES_USER" "$POSTGRES_DB"

gunzip -c "$PG_ARCHIVE" \
  | docker compose exec -T "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" "$POSTGRES_DB"

echo "PostgreSQL restore completed"

#################################
# Restore MinIO
#################################

echo "Stopping backend and MinIO before data restore..."

docker compose stop backend minio

# Confirm services are down before wiping data.
if docker compose ps backend minio | grep -qiE 'up|running'; then
  echo "ERROR: Services did not stop cleanly — aborting MinIO restore." >&2
  exit 1
fi

echo "Restoring MinIO data..."

docker run --rm \
  -v "$MINIO_VOLUME:/data" \
  -v "$BACKUP_ABS:/backup:ro" \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/minio.tar.gz -C /data"

echo "MinIO restore completed"

echo "Starting MinIO and backend..."
docker compose start minio backend
echo "Services started"

echo "===================================="
echo "Restore finished successfully"
echo "===================================="
