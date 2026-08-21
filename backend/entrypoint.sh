#!/bin/sh
set -e

echo "Waiting for the database..."
until pg_isready -h "${POSTGRES_HOST:-db}" -p "${POSTGRES_PORT:-5432}" -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; do
  sleep 1
done

python manage.py migrate --noinput
python manage.py import_products
python manage.py seed_demo_user

exec "$@"
