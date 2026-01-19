-- Add item value field for insurance purposes
-- Migration 006: Add item_value field to items table

-- Step 1: Add item_value column to store estimated value in INR
ALTER TABLE items ADD COLUMN item_value DECIMAL(12,2);

-- Step 2: Add comment for documentation
COMMENT ON COLUMN items.item_value IS 'Estimated value of the item in INR for insurance purposes';

-- Step 3: Create index for value-based queries (useful for reporting and insurance calculations)
CREATE INDEX IF NOT EXISTS idx_items_value ON items(item_value);

-- Step 4: Update the items table comment
COMMENT ON TABLE items IS 'Items table storing individual items within jobs, with support for AI identification and manual entry, including value estimation for insurance';