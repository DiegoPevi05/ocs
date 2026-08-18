-- Platform-level settings table (single row, admin-only)
-- Stores global config like AI provider, API key, etc.
CREATE TABLE IF NOT EXISTS platform_settings (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings   JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the single row if not present
INSERT INTO platform_settings (settings)
SELECT '{}'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);
