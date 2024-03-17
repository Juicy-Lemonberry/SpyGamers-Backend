#!/bin/bash

# NOTE: Use this to migrate changes in a production setting...
set -e

# Load .env file
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  exit 1
fi

export $(cat .env | grep -v '^#' | xargs)
cd SpyGamersApi

# Set DATABASE_URL
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB_NAME}"
npx prisma migrate deploy