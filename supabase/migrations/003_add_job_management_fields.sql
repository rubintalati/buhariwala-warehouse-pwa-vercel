-- Add missing columns to jobs table for job management functionality

-- Add client contact information
ALTER TABLE jobs ADD COLUMN client_phone VARCHAR(20);
ALTER TABLE jobs ADD COLUMN client_email VARCHAR(255);

-- Add address fields
ALTER TABLE jobs ADD COLUMN pickup_address TEXT;
ALTER TABLE jobs ADD COLUMN delivery_address TEXT;

-- Add date fields (rename move_date to pickup_date and add delivery_date)
ALTER TABLE jobs ADD COLUMN pickup_date DATE;
ALTER TABLE jobs ADD COLUMN delivery_date DATE;

-- Copy move_date to pickup_date for existing records
UPDATE jobs SET pickup_date = move_date WHERE move_date IS NOT NULL;

-- Add notes field
ALTER TABLE jobs ADD COLUMN notes TEXT;

-- Update status enum to match job management requirements
ALTER TABLE jobs DROP CONSTRAINT jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Update any existing status values to match new enum
UPDATE jobs SET status = 'pending' WHERE status IN ('draft', 'pending_review', 'approved');

-- Add index on client information for search functionality
CREATE INDEX idx_jobs_client_name ON jobs(client_name);
CREATE INDEX idx_jobs_client_phone ON jobs(client_phone);