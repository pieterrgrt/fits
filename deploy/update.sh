#!/bin/sh
# Nieuwe versie live zetten. Op de server draaien vanuit ~/fits: ./deploy/update.sh
# GitHub Actions roept dit ook aan na elke push naar main (.github/workflows/online-zetten.yml).
set -e
cd "$(dirname "$0")/.."
git pull --ff-only
# Eerst een back-up van de database, voor het geval een migratie misgaat.
docker compose exec -T web node scripts/backup.js 2>/dev/null || echo "Geen back-up (container draaide nog niet)."
docker compose up -d --build
docker image prune -f
