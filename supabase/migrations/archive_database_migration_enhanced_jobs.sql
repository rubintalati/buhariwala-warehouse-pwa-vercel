-- Enhanced Job Management System Database Migration
-- This migration updates the existing jobs table and creates new tables
-- to support multi-location jobs with warehouse storage capabilities

-- First, backup the existing jobs table structure
-- CREATE TABLE jobs_backup AS SELECT * FROM jobs;

-- 1. Update the existing jobs table to include new fields
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'direct_move',
ADD COLUMN IF NOT EXISTS warehouse_holding BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS selected_warehouse_id UUID REFERENCES warehouses(id),
ADD COLUMN IF NOT EXISTS estimated_storage_start_date DATE,
ADD COLUMN IF NOT EXISTS estimated_storage_end_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Create job_locations table for multiple pickup/delivery locations
CREATE TABLE IF NOT EXISTS job_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
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

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_locations_job_id ON job_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_job_locations_type ON job_locations(type);
CREATE INDEX IF NOT EXISTS idx_job_locations_date ON job_locations(date);
CREATE INDEX IF NOT EXISTS idx_jobs_warehouse_id ON jobs(selected_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);

-- 4. Update the jobs table to remove old fields that are now redundant
-- (Keep them for now to ensure backward compatibility, but mark them as deprecated)
-- We'll migrate data from old fields to new structure

-- 5. Migrate existing data from old structure to new structure
-- Insert location data for existing jobs into job_locations table
INSERT INTO job_locations (job_id, type, address, city, state, date, sequence_order)
SELECT
    id as job_id,
    'pickup' as type,
    COALESCE(pickup_address, 'Legacy address - needs update') as address,
    'Legacy city' as city,
    'Legacy state' as state,
    COALESCE(move_date, CURRENT_DATE) as date,
    1 as sequence_order
FROM jobs
WHERE id NOT IN (SELECT DISTINCT job_id FROM job_locations WHERE type = 'pickup');

INSERT INTO job_locations (job_id, type, address, city, state, date, sequence_order)
SELECT
    id as job_id,
    'delivery' as type,
    COALESCE(delivery_address, 'Legacy address - needs update') as address,
    'Legacy city' as city,
    'Legacy state' as state,
    COALESCE(move_date, CURRENT_DATE) as date,
    2 as sequence_order
FROM jobs
WHERE id NOT IN (SELECT DISTINCT job_id FROM job_locations WHERE type = 'delivery');

-- 6. Update client_phone from truck_vehicle_no where it was temporarily stored
UPDATE jobs
SET client_phone = truck_vehicle_no
WHERE client_phone IS NULL AND truck_vehicle_no IS NOT NULL;

-- 7. Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to job_locations table
DROP TRIGGER IF EXISTS update_job_locations_updated_at ON job_locations;
CREATE TRIGGER update_job_locations_updated_at
    BEFORE UPDATE ON job_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Add RLS (Row Level Security) policies for job_locations table
ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own job locations
CREATE POLICY "Users can view job locations for their jobs" ON job_locations
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM jobs WHERE created_by = auth.uid()
        )
    );

-- Policy for authenticated users to insert job locations for their jobs
CREATE POLICY "Users can insert job locations for their jobs" ON job_locations
    FOR INSERT WITH CHECK (
        job_id IN (
            SELECT id FROM jobs WHERE created_by = auth.uid()
        )
    );

-- Policy for authenticated users to update job locations for their jobs
CREATE POLICY "Users can update job locations for their jobs" ON job_locations
    FOR UPDATE USING (
        job_id IN (
            SELECT id FROM jobs WHERE created_by = auth.uid()
        )
    );

-- Policy for authenticated users to delete job locations for their jobs
CREATE POLICY "Users can delete job locations for their jobs" ON job_locations
    FOR DELETE USING (
        job_id IN (
            SELECT id FROM jobs WHERE created_by = auth.uid()
        )
    );

-- 9. Update job statuses to more descriptive values
UPDATE jobs SET status = 'pending' WHERE status = 'draft';

-- 10. Add constraints for data integrity
ALTER TABLE jobs
ADD CONSTRAINT check_job_type CHECK (job_type IN ('direct_move', 'multi_location', 'warehouse_storage'));

-- 11. Add sample data validation
-- Ensure warehouse references are valid when warehouse_holding is true
ALTER TABLE jobs
ADD CONSTRAINT check_warehouse_consistency
CHECK (
    (warehouse_holding = false) OR
    (warehouse_holding = true AND selected_warehouse_id IS NOT NULL)
);

-- 12. Create a view for easier querying of jobs with their locations
CREATE OR REPLACE VIEW jobs_with_locations AS
SELECT
    j.*,
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
    ) AS locations,
    w.name as warehouse_name,
    w.address as warehouse_address,
    w.contact_person as warehouse_contact_name,
    w.contact_phone as warehouse_contact_phone
FROM jobs j
LEFT JOIN job_locations jl ON j.id = jl.job_id
LEFT JOIN warehouses w ON j.selected_warehouse_id = w.id
GROUP BY j.id, w.name, w.address, w.contact_person, w.contact_phone;

-- 13. Grant permissions to application roles
GRANT SELECT, INSERT, UPDATE, DELETE ON job_locations TO authenticated;
GRANT USAGE ON SEQUENCE job_locations_id_seq TO authenticated;

-- Migration completed successfully
-- The database now supports:
-- 1. Multiple pickup/delivery locations per job
-- 2. Individual contact information per location
-- 3. Warehouse assignment with storage dates
-- 4. Enhanced client information storage
-- 5. Proper job typing and categorization
-- 6. Backward compatibility with existing data