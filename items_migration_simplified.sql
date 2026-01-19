-- Simplified Items Migration - Remove Room Dependency
-- Run this to update items table to work without rooms

-- Step 1: Add job_id column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS job_id UUID;

-- Step 2: Make room_id nullable (in case there are existing items)
ALTER TABLE items ALTER COLUMN room_id DROP NOT NULL;

-- Step 3: Add foreign key constraint for job_id
ALTER TABLE items ADD CONSTRAINT fk_items_job_id
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_items_job_id ON items(job_id);

-- Step 5: Update any existing items to link to their job (if rooms exist)
-- This query will set job_id based on the room's job_id for existing items
UPDATE items
SET job_id = rooms.job_id
FROM rooms
WHERE items.room_id = rooms.id
AND items.job_id IS NULL;

-- Step 6: For any items that still don't have a job_id, we'll need to handle manually
-- You can check with: SELECT * FROM items WHERE job_id IS NULL;

-- Step 7: Make job_id NOT NULL after data migration
ALTER TABLE items ALTER COLUMN job_id SET NOT NULL;