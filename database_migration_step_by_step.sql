-- Safe Step-by-Step Database Migration for Enhanced Jobs
-- Run these commands one by one to avoid conflicts

-- STEP 1: Create job_locations table first
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

-- STEP 2: Add new columns to jobs table (run each ALTER TABLE separately if needed)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'direct_move';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS warehouse_holding BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_storage_start_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_storage_end_date DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT;

-- STEP 3: Add warehouse reference (only if warehouses table exists)
-- Check if warehouses table exists first, then run this:
-- ALTER TABLE jobs ADD COLUMN IF NOT EXISTS selected_warehouse_id UUID;

-- STEP 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_job_locations_job_id ON job_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_job_locations_type ON job_locations(type);
CREATE INDEX IF NOT EXISTS idx_job_locations_date ON job_locations(date);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);

-- STEP 5: Add foreign key constraint for job_locations (run this after jobs table is updated)
-- ALTER TABLE job_locations ADD CONSTRAINT fk_job_locations_job_id
--     FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- STEP 6: Create updated timestamp trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 7: Apply trigger to job_locations table
DROP TRIGGER IF EXISTS update_job_locations_updated_at ON job_locations;
CREATE TRIGGER update_job_locations_updated_at
    BEFORE UPDATE ON job_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 8: Enable RLS for job_locations table
ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;

-- STEP 9: Migrate existing data (only run this if you have existing jobs with address data)
-- First, check what columns exist in your jobs table:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs';

-- Then run appropriate migration based on available columns:
-- If you have pickup_address/delivery_address columns:
/*
INSERT INTO job_locations (job_id, type, address, city, state, date, sequence_order)
SELECT
    id as job_id,
    'pickup' as type,
    COALESCE(pickup_address, 'Address to be updated') as address,
    'City TBD' as city,
    'State TBD' as state,
    COALESCE(move_date, CURRENT_DATE) as date,
    1 as sequence_order
FROM jobs
WHERE pickup_address IS NOT NULL AND pickup_address != ''
AND id NOT IN (SELECT DISTINCT job_id FROM job_locations WHERE type = 'pickup');

INSERT INTO job_locations (job_id, type, address, city, state, date, sequence_order)
SELECT
    id as job_id,
    'delivery' as type,
    COALESCE(delivery_address, 'Address to be updated') as address,
    'City TBD' as city,
    'State TBD' as state,
    COALESCE(move_date, CURRENT_DATE) as date,
    2 as sequence_order
FROM jobs
WHERE delivery_address IS NOT NULL AND delivery_address != ''
AND id NOT IN (SELECT DISTINCT job_id FROM job_locations WHERE type = 'delivery');
*/

-- STEP 10: Update client_phone from truck_vehicle_no if needed
-- UPDATE jobs SET client_phone = truck_vehicle_no WHERE client_phone IS NULL AND truck_vehicle_no IS NOT NULL;

-- STEP 11: Create the enhanced view (only after all tables and columns exist)
/*
CREATE OR REPLACE VIEW jobs_with_locations AS
SELECT
    j.*,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', jl.id,
                'type', jl.type,
                'address', jl.address,
                'city', jl.city,
                'state', jl.state,
                'contact_name', jl.contact_name,
                'contact_phone', jl.contact_phone,
                'contact_email', jl.contact_email,
                'date', jl.date,
                'special_instructions', jl.special_instructions,
                'sequence_order', jl.sequence_order
            ) ORDER BY jl.sequence_order
        ) FILTER (WHERE jl.id IS NOT NULL),
        '[]'::jsonb
    ) AS locations,
    w.name as warehouse_name,
    w.address as warehouse_address,
    w.contact_person as warehouse_contact_name,
    w.contact_phone as warehouse_contact_phone
FROM jobs j
LEFT JOIN job_locations jl ON j.id = jl.job_id
LEFT JOIN warehouses w ON j.selected_warehouse_id = w.id
GROUP BY j.id, w.name, w.address, w.contact_person, w.contact_phone;
*/