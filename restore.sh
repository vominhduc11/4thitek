#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh BACKUP_FOLDER"
  echo "Example:"
  echo "./restore.sh backups/20260316_140000"
  exit 1
fi

BACKUP_DIR=$1

POSTGRES_CONTAINER="postgres"
POSTGRES_DB="app_db"
POSTGRES_USER="app"

MINIO_VOLUME="4thitek_minio-data"

echo "===================================="
echo "Starting restore from: $BACKUP_DIR"
echo "===================================="

#################################
# Restore PostgreSQL
#################################

echo "Restoring PostgreSQL..."

docker compose exec $POSTGRES_CONTAINER dropdb -U $POSTGRES_USER $POSTGRES_DB || true
docker compose exec $POSTGRES_CONTAINER createdb -U $POSTGRES_USER $POSTGRES_DB

gunzip -c $BACKUP_DIR/postgres.sql.gz \
  | docker compose exec -T $POSTGRES_CONTAINER psql -U $POSTGRES_USER $POSTGRES_DB

echo "PostgreSQL restore completed"

#################################
# Restore MinIO
#################################

echo "Restoring MinIO..."

docker compose stop backend || true

docker run --rm \
  -v $MINIO_VOLUME:/data \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/minio.tar.gz -C /data"

docker compose start backend

echo "MinIO restore completed"

echo "===================================="
echo "Restore finished successfully"
echo "===================================="