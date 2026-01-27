-- Minimal Migration to Enable Enhanced Job Functionality
-- Run this first to get the basic functionality working

-- 1. Create job_locations table
CREATE TABLE IF NOT EXISTS job_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('pickup', 'delivery')),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    date DATE NOT NULL,
    special_instructions TEXT,
    sequence_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add essential columns to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'direct_move';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS warehouse_holding BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS selected_warehouse_id UUID;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_storage_start_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_storage_end_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_locations_job_id ON job_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_job_locations_type ON job_locations(type);

-- 4. Enable RLS on job_locations
ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON job_locations TO authenticated;
GRANT USAGE ON SEQUENCE job_locations_id_seq TO authenticated;