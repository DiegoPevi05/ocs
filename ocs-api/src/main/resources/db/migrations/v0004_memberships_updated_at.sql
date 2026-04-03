-- liquibase formatted sql

-- changeset ocs-admin:12
ALTER TABLE project_memberships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW();
