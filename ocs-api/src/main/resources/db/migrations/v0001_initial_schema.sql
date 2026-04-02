-- liquibase formatted sql

-- changeset ocs-admin:1
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- Global role: ADMIN or USER
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- changeset ocs-admin:2
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- changeset ocs-admin:3
CREATE TABLE project_memberships (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- Project role: SUPERVISOR or USER
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- changeset ocs-admin:4
CREATE TABLE locations (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    geo_coordinates JSONB, 
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- changeset ocs-admin:5
CREATE TABLE tracks (
    id UUID PRIMARY KEY,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path_coordinates JSONB,
    gauge_mm INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- changeset ocs-admin:6
CREATE TABLE poles (
    id UUID PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position_along_track_mm INTEGER NOT NULL,
    geo_position JSONB,
    pole_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- changeset ocs-admin:7
CREATE TABLE cantilevers (
    id UUID PRIMARY KEY,
    pole_id UUID NOT NULL REFERENCES poles(id) ON DELETE CASCADE,
    configuration VARCHAR(255) NOT NULL,
    contact_wire_height DOUBLE PRECISION,
    system_height DOUBLE PRECISION,
    zigzag DOUBLE PRECISION,
    support_offset DOUBLE PRECISION,
    calc_result_json JSONB,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- changeset ocs-admin:8
CREATE TABLE vanes (
    id UUID PRIMARY KEY,
    pole_a_id UUID NOT NULL REFERENCES poles(id) ON DELETE CASCADE,
    pole_b_id UUID NOT NULL REFERENCES poles(id) ON DELETE CASCADE,
    configuration VARCHAR(255) NOT NULL,
    cw_weight DOUBLE PRECISION,
    cw_tension DOUBLE PRECISION,
    sw_weight DOUBLE PRECISION,
    sw_tension DOUBLE PRECISION,
    initial_separation DOUBLE PRECISION,
    qty_droppers INTEGER,
    dropper_weight DOUBLE PRECISION,
    step_size DOUBLE PRECISION,
    calc_result_json JSONB,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);
