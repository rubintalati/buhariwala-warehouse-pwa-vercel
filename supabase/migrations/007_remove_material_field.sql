-- Remove material field from items table
-- Migration 007: Remove deprecated material field

-- Step 1: Drop the material column from items table
-- Note: Run this after confirming all code has been updated to use item_value instead
ALTER TABLE items DROP COLUMN IF EXISTS material;

-- Step 2: Update table comment to reflect changes
COMMENT ON TABLE items IS 'Items table storing individual items within jobs, with support for AI identification and manual entry, including value estimation for insurance (material field removed in favor of item_value)';