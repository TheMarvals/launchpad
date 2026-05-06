#!/bin/bash
BACKUP_DIR="/home/marval/backups_supplemental_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Starting supplemental backup at $(date)"

echo "Compressing Docker named volumes (/var/lib/docker/volumes)..."
sudo tar -czf "$BACKUP_DIR/docker_named_volumes.tar.gz" /var/lib/docker/volumes

echo "Compressing marval home directory (excluding backups)..."
sudo tar -czf "$BACKUP_DIR/home_marval_configs.tar.gz" --exclude='backups_*' /home/marval

echo "Checking for /etc/nginx and /etc/traefik..."
[ -d /etc/nginx ] && sudo tar -czf "$BACKUP_DIR/etc_nginx.tar.gz" /etc/nginx
[ -d /etc/traefik ] && sudo tar -czf "$BACKUP_DIR/etc_traefik.tar.gz" /etc/traefik

echo "Supplemental backup complete in $BACKUP_DIR"
ls -lh "$BACKUP_DIR"
