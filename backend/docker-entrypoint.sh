#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z db 5432; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "Database is up!"

echo "Running Prisma migrations..."
npx prisma db push --accept-data-loss

echo "Checking if seed data needs to be loaded..."
# Check if Admin table has data
ADMIN_COUNT=$(psql -h db -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM \"Admin\";" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$ADMIN_COUNT" = "0" ] || [ -z "$ADMIN_COUNT" ]; then
  echo "Loading seed data..."
  if [ -f /app/seed-data.sql ]; then
    PGPASSWORD="$DB_PASSWORD" psql -h db -U "$DB_USER" -d "$DB_NAME" -f /app/seed-data.sql
    echo "Seed data loaded successfully!"
  else
    echo "No seed file found, skipping..."
  fi
else
  echo "Database already has data ($ADMIN_COUNT admins), skipping seed..."
fi

echo "Starting server..."
exec npm start
