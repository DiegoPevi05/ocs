-- liquibase formatted sql

-- changeset ocs-admin:11
ALTER TABLE cantilevers  ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
ALTER TABLE vanes        ADD COLUMN IF NOT EXISTS created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
