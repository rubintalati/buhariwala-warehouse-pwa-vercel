-- Migration 009: Update items table room_id to delivery_id for multi-location support
-- This migration changes the room_id column to delivery_id to better represent location mapping

-- Add delivery_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'delivery_id') THEN
        ALTER TABLE items ADD COLUMN delivery_id INTEGER DEFAULT 1;
    END IF;
END $$;

-- Copy existing room_id values to delivery_id (if room_id exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'room_id') THEN
        -- Update delivery_id with room_id values, defaulting to 1 for NULL values
        UPDATE items SET delivery_id = COALESCE(room_id, 1);

        -- Drop room_id column after copying data
        ALTER TABLE items DROP COLUMN room_id;
    END IF;
END $$;

-- Add comment to delivery_id column
COMMENT ON COLUMN items.delivery_id IS 'Maps item to delivery location: 1=first delivery, 2=second delivery, etc.';

-- Add constraint to ensure delivery_id is positive
ALTER TABLE items ADD CONSTRAINT check_delivery_id_positive CHECK (delivery_id > 0);

-- Create sample multi-location job for testing
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_date, delivery_date,
    status, job_type, notes, created_by, created_at, updated_at
) VALUES (
    '77777777-7777-7777-7777-777777777777',
    'BL-2024-007',
    'Arjun Patel',
    '+91 9876543216',
    'arjun.patel@email.com',
    '2024-01-30',
    '2024-02-01',
    'draft',
    'multi_location',
    'Multi-location corporate office relocation with 3 delivery addresses',
    (SELECT id FROM users WHERE username = 'maker1'),
    '2024-01-22T16:00:00Z',
    '2024-01-22T16:00:00Z'
) ON CONFLICT (id) DO NOTHING;

-- Add pickup location for multi-location job
INSERT INTO job_locations (job_id, location_type, sequence_order, address, city, state, contact_name, contact_phone) VALUES
('77777777-7777-7777-7777-777777777777', 'pickup', 1, 'Corporate Office, Cyber City, Gurgaon, Haryana', 'Gurgaon', 'Haryana', 'Arjun Patel', '+91 9876543216')
ON CONFLICT DO NOTHING;

-- Add multiple delivery locations for multi-location job
INSERT INTO job_locations (job_id, location_type, sequence_order, address, city, state, contact_name, contact_phone) VALUES
('77777777-7777-7777-7777-777777777777', 'delivery', 2, 'Branch Office 1, Connaught Place, New Delhi', 'New Delhi', 'Delhi', 'Ravi Kumar', '+91 9876543217'),
('77777777-7777-7777-7777-777777777777', 'delivery', 3, 'Branch Office 2, Janpath, New Delhi', 'New Delhi', 'Delhi', 'Sunita Sharma', '+91 9876543218'),
('77777777-7777-7777-7777-777777777777', 'delivery', 4, 'Branch Office 3, Karol Bagh, New Delhi', 'New Delhi', 'Delhi', 'Vikram Singh', '+91 9876543219')
ON CONFLICT DO NOTHING;

-- Add items distributed across different delivery locations
INSERT INTO items (job_id, delivery_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
-- Items for Delivery Location 1 (Connaught Place)
('77777777-7777-7777-7777-777777777777', 1, 'Executive Desks', 'Furniture', 3, 'excellent', '180x80x75 cm', 50.0, 'Heavy wooden desks, disassemble legs', false, 45000.00),
('77777777-7777-7777-7777-777777777777', 1, 'Manager Chairs', 'Furniture', 3, 'excellent', '70x70x120 cm', 20.0, 'High-back leather chairs', false, 18000.00),
('77777777-7777-7777-7777-777777777777', 1, 'Conference Table', 'Furniture', 1, 'excellent', '300x120x75 cm', 80.0, 'Large boardroom table, detachable sections', false, 65000.00),
('77777777-7777-7777-7777-777777777777', 1, 'Conference Chairs', 'Furniture', 12, 'excellent', '60x60x90 cm', 12.0, 'Matching conference room seating', false, 36000.00),
('77777777-7777-7777-7777-777777777777', 1, 'Server Equipment', 'Electronics', 2, 'excellent', '60x80x120 cm', 40.0, 'Critical IT equipment, climate controlled transport', true, 150000.00),

-- Items for Delivery Location 2 (Janpath)
('77777777-7777-7777-7777-777777777777', 2, 'Workstation Desks', 'Furniture', 8, 'good', '140x70x75 cm', 35.0, 'Standard office desks with drawers', false, 80000.00),
('77777777-7777-7777-7777-777777777777', 2, 'Office Chairs', 'Furniture', 8, 'good', '65x65x110 cm', 15.0, 'Adjustable height office chairs', false, 32000.00),
('77777777-7777-7777-7777-777777777777', 2, 'Filing Cabinets', 'Furniture', 6, 'excellent', '40x60x130 cm', 45.0, 'Metal filing cabinets, empty before moving', false, 18000.00),
('77777777-7777-7777-7777-777777777777', 2, 'Desktop Computers', 'Electronics', 8, 'excellent', '20x45x40 cm', 8.0, 'Dell OptiPlex systems with monitors', true, 120000.00),
('77777777-7777-7777-7777-777777777777', 2, 'Printers & Scanners', 'Electronics', 4, 'excellent', '50x40x30 cm', 15.0, 'Office printing equipment', false, 40000.00),

-- Items for Delivery Location 3 (Karol Bagh)
('77777777-7777-7777-7777-777777777777', 3, 'Reception Desk', 'Furniture', 1, 'excellent', '200x80x110 cm', 60.0, 'L-shaped reception counter', false, 35000.00),
('77777777-7777-7777-7777-777777777777', 3, 'Reception Chairs', 'Furniture', 4, 'excellent', '60x60x80 cm', 10.0, 'Visitor seating area chairs', false, 12000.00),
('77777777-7777-7777-7777-777777777777', 3, 'Coffee Tables', 'Furniture', 2, 'excellent', '120x60x40 cm', 20.0, 'Reception area coffee tables', false, 8000.00),
('77777777-7777-7777-7777-777777777777', 3, 'Pantry Equipment', 'Appliances', 1, 'excellent', '60x60x180 cm', 45.0, 'Small refrigerator and microwave', false, 25000.00),
('77777777-7777-7777-7777-777777777777', 3, 'Office Supplies', 'Documents', 10, 'excellent', '30x20x15 cm', 2.0, 'Box files, stationery, miscellaneous', false, 5000.00)
ON CONFLICT DO NOTHING;

-- Update the existing sample data migration items to use delivery_id instead of room_id
UPDATE items SET delivery_id = 1 WHERE delivery_id IS NULL OR delivery_id = 0;

-- Create index for delivery_id lookups
CREATE INDEX IF NOT EXISTS idx_items_delivery_id ON items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_items_job_delivery ON items(job_id, delivery_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully updated items table to use delivery_id for multi-location support';
    RAISE NOTICE 'Added sample multi-location job with 3 delivery addresses and distributed items';
    RAISE NOTICE 'Items are now mapped: delivery_id 1, 2, 3 = different delivery locations';
END $$;