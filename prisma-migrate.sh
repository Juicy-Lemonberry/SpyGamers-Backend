#!/bin/bash

# NOTE: Quick and dirty script to migrate prisma's changes, while database is running...
# Make sure this script fails when any command fails
set -e

# Check if the migration name is provided
if [ -z "$1" ]; then
  echo "Error: No migration name provided."
  echo "Usage: $0 MIGRATION_NAME"
  exit 1
fi

MIGRATION_NAME=$1

# Load .env file
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  exit 1
fi

export $(cat .env | grep -v '^#' | xargs)
cd SpyGamersApi


# Set DATABASE_URL
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB_NAME}"

# Run Prisma migrate
npx prisma migrate dev --name "$MIGRATION_NAME"