-- liquibase formatted sql

-- changeset ocs-admin:5001
-- validCheckSum: ANY
ALTER TABLE cantilevers
    ADD COLUMN IF NOT EXISTS contact_wire_vertical_offset DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS fixing_distance              DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS bottom_fixed_height          DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS u                            DOUBLE PRECISION DEFAULT 0,
    ADD COLUMN IF NOT EXISTS curve_radius_direction       VARCHAR(50)      DEFAULT 'inside';

-- changeset ocs-admin:5002
ALTER TABLE poles
    ADD COLUMN IF NOT EXISTS cantilevers_quantity  INTEGER          DEFAULT 1,
    ADD COLUMN IF NOT EXISTS cat_separation        DOUBLE PRECISION DEFAULT 720;
