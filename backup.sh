#!/bin/bash

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="./backups"
BACKUP_DIR="$BACKUP_ROOT/$DATE"

POSTGRES_CONTAINER="postgres"
POSTGRES_DB="app_db"
POSTGRES_USER="app"

MINIO_VOLUME="4thitek_minio-data"

RETENTION_DAYS=7

echo "===================================="
echo "Starting backup: $DATE"
echo "===================================="

mkdir -p "$BACKUP_DIR"

#################################
# PostgreSQL Backup
#################################

echo "Backing up PostgreSQL..."

docker compose exec -T $POSTGRES_CONTAINER \
  pg_dump -U $POSTGRES_USER -d $POSTGRES_DB \
  --no-owner --no-privileges \
  | gzip > "$BACKUP_DIR/postgres.sql.gz"

echo "PostgreSQL backup completed"

#################################
# MinIO Backup
#################################

echo "Backing up MinIO..."

docker run --rm \
  -v $MINIO_VOLUME:/data \
  -v $(pwd)/$BACKUP_DIR:/backup \
  alpine \
  tar czf /backup/minio.tar.gz -C /data .

echo "MinIO backup completed"

#################################
# Cleanup old backups
#################################

echo "Cleaning backups older than $RETENTION_DAYS days..."

find $BACKUP_ROOT -mindepth 1 -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

echo "Cleanup completed"

echo "===================================="
echo "Backup finished successfully"
echo "Location: $BACKUP_DIR"
echo "===================================="