-- Add date column to job_locations table and migrate dates from jobs table
-- This column will store the scheduled date for each location in the logistics chain

-- First add the date column to job_locations
ALTER TABLE job_locations ADD COLUMN date DATE;

-- Update existing job_locations with dates from job_schedule if they exist
UPDATE job_locations SET date = (
    SELECT js.scheduled_date
    FROM job_schedule js
    WHERE js.location_id = job_locations.id
    AND js.schedule_type = CASE
        WHEN job_locations.location_type = 'pickup' THEN 'pickup'
        WHEN job_locations.location_type = 'delivery' THEN 'delivery'
    END
    LIMIT 1
);

-- If no schedule exists, use the job's pickup/delivery dates as fallback
UPDATE job_locations SET date = (
    SELECT CASE
        WHEN job_locations.location_type = 'pickup' THEN j.pickup_date::date
        WHEN job_locations.location_type = 'delivery' THEN j.delivery_date::date
    END
    FROM jobs j
    WHERE j.id = job_locations.job_id
) WHERE date IS NULL;

-- Add a comment to explain the column purpose
COMMENT ON COLUMN job_locations.date IS 'Scheduled date for pickup or delivery at this location';

-- Remove pickup_date and delivery_date columns from jobs table since dates are now location-specific
-- Check if columns exist before dropping them
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'pickup_date') THEN
        ALTER TABLE jobs DROP COLUMN pickup_date;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'delivery_date') THEN
        ALTER TABLE jobs DROP COLUMN delivery_date;
    END IF;
END $$;