-- Add project-level settings (defaults for poles, cantilevers, vanes, catenary system)

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS settings JSONB;
