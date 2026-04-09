-- Add cross-section dimension columns to poles table

ALTER TABLE poles
ADD COLUMN IF NOT EXISTS width DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS length DOUBLE PRECISION;
