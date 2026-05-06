#!/bin/bash
# Backup script for 192.168.1.250
# Created by Antigravity

BACKUP_DIR="/home/marval/backups_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Starting backup at $(date)" | tee -a "$BACKUP_DIR/backup.log"

# PostgreSQL: coolify-db
echo "Dumping coolify-db..." | tee -a "$BACKUP_DIR/backup.log"
docker exec coolify-db pg_dumpall -U postgres > "$BACKUP_DIR/coolify-db_dump.sql" 2>> "$BACKUP_DIR/backup.log"

# PostgreSQL: az2vg3zfvgsb65qhp1jnuxw6 (cotizador)
echo "Dumping cotizador-db..." | tee -a "$BACKUP_DIR/backup.log"
docker exec az2vg3zfvgsb65qhp1jnuxw6 pg_dumpall -U postgres > "$BACKUP_DIR/cotizador-db_dump.sql" 2>> "$BACKUP_DIR/backup.log"

# MariaDB: ufo5mratmqr5q1jbd60tn5q2
echo "Dumping mariadb..." | tee -a "$BACKUP_DIR/backup.log"
MARIADB_PWD=$(docker exec ufo5mratmqr5q1jbd60tn5q2 printenv MARIADB_ROOT_PASSWORD)
docker exec ufo5mratmqr5q1jbd60tn5q2 mariadb-dump -u root -p"$MARIADB_PWD" --all-databases > "$BACKUP_DIR/mariadb_dump.sql" 2>> "$BACKUP_DIR/backup.log"

# Volumes: /data/coolify
echo "Compressing /data/coolify (this may take a while)..." | tee -a "$BACKUP_DIR/backup.log"
sudo tar -czf "$BACKUP_DIR/coolify_data.tar.gz" /data/coolify 2>> "$BACKUP_DIR/backup.log"

echo "Backup complete in $BACKUP_DIR" | tee -a "$BACKUP_DIR/backup.log"
ls -lh "$BACKUP_DIR" | tee -a "$BACKUP_DIR/backup.log"
