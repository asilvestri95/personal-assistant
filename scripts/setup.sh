#!/bin/bash
set -e

echo "=== Personal Assistant Setup ==="

# Generate auth secret if not set
if grep -q "change-me" .env 2>/dev/null; then
  SECRET=$(openssl rand -base64 32)
  sed -i "s|change-me-generate-with-openssl-rand-base64-32|$SECRET|" .env
  echo "✓ Generated AUTH_SECRET"
fi

echo "Starting Postgres..."
docker compose up -d db
echo "Waiting for Postgres to be ready..."
sleep 3

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Running migrations..."
npx prisma migrate deploy

echo "Seeding initial invite codes..."
npx tsx prisma/seed.ts

echo ""
echo "=== Setup complete ==="
echo "Invite codes seeded: WELCOME-2024, PACK-IT-UP, ASSISTANT-01"
echo "Run 'npm run dev' to start the development server."
