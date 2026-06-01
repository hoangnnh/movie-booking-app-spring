#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (jdbc:postgresql://host:port/database)" >&2
  exit 1
fi

FLYWAY_USER="${DATABASE_USERNAME:-postgres}"
FLYWAY_PASSWORD="${DATABASE_PASSWORD:-postgres}"

cd "${BACKEND_DIR}"
./mvnw -q flyway:migrate \
  -Dflyway.url="${DATABASE_URL}" \
  -Dflyway.user="${FLYWAY_USER}" \
  -Dflyway.password="${FLYWAY_PASSWORD}"

echo "Flyway migrations applied successfully."
