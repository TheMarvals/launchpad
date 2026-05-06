#!/bin/bash
BACKUP_DIR="/home/marval/backups_v3_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Starting backup v3 at $(date)"

# Coolify DB (Postgres)
echo "Dumping coolify-db..."
COOLIFY_DB_PWD=$(docker exec coolify-db printenv POSTGRES_PASSWORD)
docker exec -e PGPASSWORD="$COOLIFY_DB_PWD" coolify-db pg_dump -U coolify coolify > "$BACKUP_DIR/coolify-db_dump.sql"

# Cotizador DB (Postgres)
echo "Dumping cotizador-db..."
COTIZADOR_DB_PWD="1IrATF3mUzgefByV5bvFb3RhzuZqsIZzMIibs2Yd6sCaqbPPsQ9UOUs4Fqzg4Diy"
docker exec -e PGPASSWORD="$COTIZADOR_DB_PWD" az2vg3zfvgsb65qhp1jnuxw6 pg_dump -U postgres cotizador > "$BACKUP_DIR/cotizador-db_dump.sql"

# MariaDB
echo "Dumping mariadb..."
MARIADB_PWD=$(docker exec ufo5mratmqr5q1jbd60tn5q2 printenv MARIADB_ROOT_PASSWORD)
docker exec ufo5mratmqr5q1jbd60tn5q2 mariadb-dump -u root -p"$MARIADB_PWD" --all-databases > "$BACKUP_DIR/mariadb_dump.sql"

# Volumes
echo "Compressing /opt (requested volumes)..."
sudo tar -czf "$BACKUP_DIR/opt_data.tar.gz" /opt

echo "Compressing /data/coolify..."
sudo tar -czf "$BACKUP_DIR/coolify_data.tar.gz" /data/coolify

echo "Backup v3 complete in $BACKUP_DIR"
ls -lh "$BACKUP_DIR"
