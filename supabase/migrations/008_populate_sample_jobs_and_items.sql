-- Migration 008: Populate sample jobs and items
-- This migration adds 10 sample jobs with their corresponding items

-- First, create sample users for created_by references (if they don't exist)
DO $$
BEGIN
    -- Create makers
    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'maker1') THEN
        PERFORM create_user_with_password('maker1', 'maker1@buhariwala.com', 'password123', 'Rajesh Kumar', 'maker', '+91-9876543210');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'maker2') THEN
        PERFORM create_user_with_password('maker2', 'maker2@buhariwala.com', 'password123', 'Priya Sharma', 'maker', '+91-8765432109');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'checker1') THEN
        PERFORM create_user_with_password('checker1', 'checker1@buhariwala.com', 'password123', 'Amit Singh', 'checker', '+91-7654321098');
    END IF;
END $$;

-- Update jobs table status constraint to include new status types
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check
    CHECK (status IN ('draft', 'pending', 'in_progress', 'completed', 'cancelled'));

-- Job 1: BL-2024-001 (In Progress with Warehouse)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, job_type, warehouse_holding, selected_warehouse_id,
    estimated_storage_start_date, estimated_storage_end_date,
    notes, created_by, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'BL-2024-001',
    'Rajesh Sharma',
    '+91 9876543210',
    'rajesh.sharma@email.com',
    'Sector 21, Gurgaon, Haryana',
    'Lajpat Nagar, New Delhi',
    '2024-01-25',
    '2024-01-27',
    'in_progress',
    'warehouse_storage',
    true,
    (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1),
    '2024-01-25',
    '2024-01-26',
    'Fragile items include glassware and electronics',
    (SELECT id FROM users WHERE username = 'maker1'),
    '2024-01-20T10:30:00Z',
    '2024-01-20T10:30:00Z'
);

-- Items for Job 1 (45 items total value)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('11111111-1111-1111-1111-111111111111', 'LED Smart TV 55 inch', 'Electronics', 1, 'excellent', '123x71x8 cm', 18.5, 'Handle with care, original packaging preferred', true, 75000.00),
('11111111-1111-1111-1111-111111111111', 'Leather Sofa Set (3+2)', 'Furniture', 1, 'good', '200x90x85 cm', 85.0, 'Heavy item, requires 2+ people', false, 120000.00),
('11111111-1111-1111-1111-111111111111', 'Dining Table (6 seater)', 'Furniture', 1, 'excellent', '180x90x75 cm', 45.0, 'Wooden, disassemble legs if needed', false, 35000.00),
('11111111-1111-1111-1111-111111111111', 'Dining Chairs', 'Furniture', 6, 'good', '45x45x95 cm', 8.0, 'Stack carefully to save space', false, 3000.00),
('11111111-1111-1111-1111-111111111111', 'Refrigerator (Double Door)', 'Appliances', 1, 'excellent', '60x65x170 cm', 75.0, 'Keep upright, defrost before moving', false, 45000.00),
('11111111-1111-1111-1111-111111111111', 'Washing Machine', 'Appliances', 1, 'good', '60x60x85 cm', 65.0, 'Drain water completely before moving', false, 28000.00),
('11111111-1111-1111-1111-111111111111', 'Queen Size Bed', 'Furniture', 1, 'excellent', '200x160x30 cm', 40.0, 'Disassemble if possible', false, 25000.00),
('11111111-1111-1111-1111-111111111111', 'Mattress (Queen)', 'Furniture', 1, 'excellent', '200x160x20 cm', 25.0, 'Use mattress cover for protection', false, 15000.00),
('11111111-1111-1111-1111-111111111111', 'Wardrobe (3 Door)', 'Furniture', 1, 'good', '180x60x200 cm', 95.0, 'Disassemble for easier transport', false, 40000.00),
('11111111-1111-1111-1111-111111111111', 'Microwave Oven', 'Appliances', 1, 'excellent', '50x40x30 cm', 15.0, 'Remove turntable and pack separately', false, 12000.00),
('11111111-1111-1111-1111-111111111111', 'Kitchen Utensils Set', 'Kitchen', 25, 'good', '30x20x15 cm', 2.0, 'Wrap sharp items carefully', false, 5000.00),
('11111111-1111-1111-1111-111111111111', 'Dinner Set (12 pieces)', 'Kitchen', 1, 'excellent', '40x30x15 cm', 8.0, 'Fragile - bubble wrap each piece', true, 8000.00),
('11111111-1111-1111-1111-111111111111', 'Study Table with Drawers', 'Furniture', 1, 'excellent', '120x60x75 cm', 25.0, 'Remove drawers before moving', false, 15000.00),
('11111111-1111-1111-1111-111111111111', 'Office Chair', 'Furniture', 1, 'good', '65x65x110 cm', 12.0, 'Adjustable height, wrap wheels', false, 8000.00),
('11111111-1111-1111-1111-111111111111', 'Bookshelf (5 shelves)', 'Furniture', 1, 'good', '80x30x180 cm', 30.0, 'Disassemble shelves', false, 12000.00);

-- Job 2: BL-2024-002 (Pending Approval)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, notes, created_by, created_at, updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'BL-2024-002',
    'Priya Mehta',
    '+91 9876543211',
    'priya.mehta@email.com',
    'Bandra West, Mumbai, Maharashtra',
    'Koramangala, Bangalore, Karnataka',
    '2024-01-28',
    '2024-01-30',
    'pending',
    'Office relocation, all electronics need special care',
    (SELECT id FROM users WHERE username = 'maker2'),
    '2024-01-21T14:15:00Z',
    '2024-01-21T14:15:00Z'
);

-- Items for Job 2 (23 items total)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('22222222-2222-2222-2222-222222222222', 'Office Desk (Executive)', 'Furniture', 1, 'excellent', '150x75x75 cm', 35.0, 'Detach drawers separately', false, 18000.00),
('22222222-2222-2222-2222-222222222222', 'Ergonomic Office Chair', 'Furniture', 2, 'excellent', '65x65x110 cm', 15.0, 'Adjustable height, wrap carefully', false, 12000.00),
('22222222-2222-2222-2222-222222222222', 'Laptop (MacBook Pro)', 'Electronics', 1, 'excellent', '35x25x2 cm', 2.0, 'Original box preferred, fragile', true, 150000.00),
('22222222-2222-2222-2222-222222222222', 'Monitor (27 inch)', 'Electronics', 2, 'excellent', '65x45x20 cm', 7.0, 'Bubble wrap screen, original packaging', true, 35000.00),
('22222222-2222-2222-2222-222222222222', 'Filing Cabinet', 'Furniture', 1, 'good', '40x60x130 cm', 45.0, 'Empty all drawers before moving', false, 8000.00),
('22222222-2222-2222-2222-222222222222', 'Office Books & Files', 'Documents', 15, 'excellent', '30x20x5 cm', 2.0, 'Pack in small boxes to avoid overweight', false, 500.00),
('22222222-2222-2222-2222-222222222222', 'Printer (Laser)', 'Electronics', 1, 'excellent', '40x35x25 cm', 12.0, 'Remove toner cartridge before moving', false, 25000.00),
('22222222-2222-2222-2222-222222222222', 'Coffee Machine', 'Appliances', 1, 'excellent', '25x30x35 cm', 8.0, 'Clean and dry before packing', false, 15000.00);

-- Job 3: BL-2024-003 (Completed)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, notes, created_by, created_at, updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'BL-2024-003',
    'Amit Kumar',
    '+91 9876543212',
    'amit.kumar@email.com',
    'Connaught Place, New Delhi',
    'Sector 18, Noida, Uttar Pradesh',
    '2024-01-22',
    '2024-01-23',
    'completed',
    'Student accommodation, minimal items',
    (SELECT id FROM users WHERE username = 'maker1'),
    '2024-01-18T09:20:00Z',
    '2024-01-23T16:45:00Z'
);

-- Items for Job 3 (12 items total)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('33333333-3333-3333-3333-333333333333', 'Single Bed', 'Furniture', 1, 'good', '190x90x30 cm', 25.0, 'Foldable bed frame', false, 8000.00),
('33333333-3333-3333-3333-333333333333', 'Study Table', 'Furniture', 1, 'excellent', '120x60x75 cm', 20.0, 'Wooden table with drawers', false, 6000.00),
('33333333-3333-3333-3333-333333333333', 'Plastic Chair', 'Furniture', 2, 'good', '50x50x80 cm', 3.0, 'Stack for easy transport', false, 1000.00),
('33333333-3333-3333-3333-333333333333', 'Clothes & Personal Items', 'Personal', 5, 'excellent', '50x30x20 cm', 5.0, 'Pack in suitcases and bags', false, 5000.00),
('33333333-3333-3333-3333-333333333333', 'Books & Stationery', 'Documents', 3, 'excellent', '25x20x5 cm', 1.5, 'Pack in small boxes', false, 2000.00),
('33333333-3333-3333-3333-333333333333', 'Small TV (32 inch)', 'Electronics', 1, 'good', '73x43x8 cm', 8.0, 'Bubble wrap screen', true, 18000.00);

-- Job 4: BL-2024-004 (Draft with Warehouse)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, job_type, warehouse_holding, selected_warehouse_id,
    estimated_storage_start_date, estimated_storage_end_date,
    notes, created_by, created_at, updated_at
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    'BL-2024-004',
    'Sunita Agarwal',
    '+91 9876543213',
    'sunita.agarwal@email.com',
    'Jayanagar, Bangalore, Karnataka',
    'MG Road, Pune, Maharashtra',
    '2024-02-01',
    '2024-02-03',
    'draft',
    'warehouse_storage',
    true,
    (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1),
    '2024-02-01',
    '2024-02-02',
    'Full household relocation, temporary storage needed',
    (SELECT id FROM users WHERE username = 'checker1'),
    '2024-01-22T11:00:00Z',
    '2024-01-22T11:00:00Z'
);

-- Items for Job 4 (67 items total)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('44444444-4444-4444-4444-444444444444', 'King Size Bed Frame', 'Furniture', 1, 'excellent', '220x180x40 cm', 65.0, 'Heavy wooden frame, disassemble', false, 45000.00),
('44444444-4444-4444-4444-444444444444', 'King Mattress', 'Furniture', 1, 'excellent', '220x180x25 cm', 35.0, 'Memory foam, handle carefully', false, 28000.00),
('44444444-4444-4444-4444-444444444444', 'Wardrobe (4 Door)', 'Furniture', 1, 'good', '240x60x220 cm', 120.0, 'Large wardrobe, full disassembly needed', false, 55000.00),
('44444444-4444-4444-4444-444444444444', 'Dressing Table with Mirror', 'Furniture', 1, 'excellent', '120x45x160 cm', 40.0, 'Mirror is fragile, wrap separately', true, 22000.00),
('44444444-4444-4444-4444-444444444444', 'Side Tables', 'Furniture', 2, 'excellent', '40x40x50 cm', 8.0, 'Matching pair, wooden', false, 8000.00),
('44444444-4444-4444-4444-444444444444', '8 Seater Dining Set', 'Furniture', 1, 'excellent', '220x100x75 cm', 80.0, 'Table + 8 chairs, solid wood', false, 85000.00),
('44444444-4444-4444-4444-444444444444', 'Living Room Sofa (L-shaped)', 'Furniture', 1, 'excellent', '280x180x90 cm', 110.0, 'Sectional sofa, detach sections', false, 150000.00),
('44444444-4444-4444-4444-444444444444', 'Coffee Table (Glass Top)', 'Furniture', 1, 'excellent', '120x60x40 cm', 25.0, 'Glass top, extremely fragile', true, 15000.00),
('44444444-4444-4444-4444-444444444444', 'TV Unit', 'Furniture', 1, 'excellent', '180x40x60 cm', 35.0, 'Wall mounted, remove brackets', false, 18000.00),
('44444444-4444-4444-4444-444444444444', '65 inch OLED TV', 'Electronics', 1, 'excellent', '145x83x5 cm', 28.0, 'Very expensive, original packaging essential', true, 200000.00),
('44444444-4444-4444-4444-444444444444', 'Home Theater System', 'Electronics', 1, 'excellent', '50x30x15 cm', 12.0, 'Multiple speakers, label all cables', true, 45000.00),
('44444444-4444-4444-4444-444444444444', 'Refrigerator (French Door)', 'Appliances', 1, 'excellent', '70x70x180 cm', 95.0, 'Premium model, keep upright', false, 85000.00),
('44444444-4444-4444-4444-444444444444', 'Dishwasher', 'Appliances', 1, 'excellent', '60x60x85 cm', 50.0, 'Drain completely, secure door', false, 55000.00),
('44444444-4444-4444-4444-444444444444', 'Washing Machine (Front Load)', 'Appliances', 1, 'excellent', '60x65x85 cm', 70.0, 'Premium model, transport bolts needed', false, 65000.00),
('44444444-4444-4444-4444-444444444444', 'Air Conditioner Units', 'Appliances', 3, 'excellent', '80x30x55 cm', 35.0, 'Split AC units, professional handling needed', false, 45000.00),
('44444444-4444-4444-4444-444444444444', 'Kitchen Cabinets & Utensils', 'Kitchen', 40, 'excellent', '30x30x30 cm', 5.0, 'Modular kitchen items, pack systematically', false, 25000.00),
('44444444-4444-4444-4444-444444444444', 'Crockery & Glassware', 'Kitchen', 15, 'excellent', '30x30x15 cm', 3.0, 'Extremely fragile, professional packing', true, 12000.00);

-- Job 5: BL-2024-005 (Cancelled)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, notes, created_by, created_at, updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    'BL-2024-005',
    'Vikram Singh',
    '+91 9876543214',
    'vikram.singh@email.com',
    'Salt Lake, Kolkata, West Bengal',
    'Hitech City, Hyderabad, Telangana',
    '2024-01-29',
    '2024-01-31',
    'cancelled',
    'Client cancelled due to date change',
    (SELECT id FROM users WHERE username = 'maker2'),
    '2024-01-19T13:30:00Z',
    '2024-01-24T10:15:00Z'
);

-- Items for Job 5 (34 items total)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('55555555-5555-5555-5555-555555555555', 'Office Workstation', 'Furniture', 1, 'good', '160x80x75 cm', 45.0, 'Modular office desk with hutch', false, 25000.00),
('55555555-5555-5555-5555-555555555555', 'Swivel Office Chairs', 'Furniture', 3, 'good', '65x65x110 cm', 18.0, 'Hydraulic chairs, wrap bases', false, 15000.00),
('55555555-5555-5555-5555-555555555555', 'Meeting Table', 'Furniture', 1, 'excellent', '200x100x75 cm', 50.0, 'Conference table, seats 8', false, 35000.00),
('55555555-5555-5555-5555-555555555555', 'Desktop Computer', 'Electronics', 2, 'excellent', '20x45x40 cm', 8.0, 'Pack in original boxes if available', true, 80000.00),
('55555555-5555-5555-5555-555555555555', '24 inch Monitors', 'Electronics', 4, 'excellent', '55x35x18 cm', 5.0, 'LED monitors, bubble wrap screens', true, 60000.00),
('55555555-5555-5555-5555-555555555555', 'Network Equipment', 'Electronics', 1, 'excellent', '40x25x15 cm', 3.0, 'Router, switches, cables', false, 12000.00),
('55555555-5555-5555-5555-555555555555', 'Office Supplies & Files', 'Documents', 20, 'excellent', '35x25x10 cm', 2.5, 'Box files, stationery, documents', false, 3000.00),
('55555555-5555-5555-5555-555555555555', 'Whiteboard', 'Office', 1, 'good', '120x90x3 cm', 8.0, 'Magnetic whiteboard with markers', false, 4000.00),
('55555555-5555-5555-5555-555555555555', 'Projection Screen', 'Electronics', 1, 'excellent', '200x150x5 cm', 12.0, 'Motorized projector screen', false, 18000.00),
('55555555-5555-5555-5555-555555555555', 'Office Carpet', 'Furniture', 1, 'good', '400x300x2 cm', 25.0, 'Roll carefully, office flooring', false, 8000.00);

-- Job 6: BL-2024-006 (In Progress)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, notes, created_by, created_at, updated_at
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    'BL-2024-006',
    'Neha Gupta',
    '+91 9876543215',
    'neha.gupta@email.com',
    'Andheri East, Mumbai, Maharashtra',
    'Vasant Vihar, New Delhi',
    '2024-01-26',
    '2024-01-28',
    'in_progress',
    'Designer apartment, expensive items',
    (SELECT id FROM users WHERE username = 'maker1'),
    '2024-01-21T08:45:00Z',
    '2024-01-26T09:30:00Z'
);

-- Items for Job 6 (89 items total)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('66666666-6666-6666-6666-666666666666', 'Designer Leather Sofa', 'Furniture', 1, 'excellent', '220x95x85 cm', 90.0, 'Italian leather, white color, very expensive', false, 180000.00),
('66666666-6666-6666-6666-666666666666', 'Marble Coffee Table', 'Furniture', 1, 'excellent', '140x70x45 cm', 85.0, 'Imported marble top, extremely heavy', true, 75000.00),
('66666666-6666-6666-6666-666666666666', 'Designer Dining Set (6 seater)', 'Furniture', 1, 'excellent', '180x90x75 cm', 70.0, 'Glass top dining table with metal frame', true, 95000.00),
('66666666-6666-6666-6666-666666666666', 'Chandelier', 'Lighting', 1, 'excellent', '80x80x120 cm', 25.0, 'Crystal chandelier, disassemble carefully', true, 65000.00),
('66666666-6666-6666-6666-666666666666', 'King Bed (Platform)', 'Furniture', 1, 'excellent', '210x180x35 cm', 55.0, 'Modern platform bed, solid wood', false, 85000.00),
('66666666-6666-6666-6666-666666666666', 'Premium Mattress', 'Furniture', 1, 'excellent', '210x180x30 cm', 40.0, 'Memory foam with cooling gel', false, 120000.00),
('66666666-6666-6666-6666-666666666666', 'Walk-in Closet Items', 'Personal', 50, 'excellent', '40x30x20 cm', 3.0, 'Designer clothes, shoes, accessories', false, 200000.00),
('66666666-6666-6666-6666-666666666666', '75 inch QLED TV', 'Electronics', 1, 'excellent', '167x96x6 cm', 35.0, 'Premium Samsung QLED, original packaging', true, 350000.00),
('66666666-6666-6666-6666-666666666666', 'Sound System (Bose)', 'Electronics', 1, 'excellent', '60x40x30 cm', 15.0, 'High-end audio system, multiple components', true, 150000.00),
('66666666-6666-6666-6666-666666666666', 'Kitchen Appliances Set', 'Appliances', 8, 'excellent', '40x30x25 cm', 8.0, 'Miele appliances, professional packing', false, 125000.00),
('66666666-6666-6666-6666-666666666666', 'Art Pieces & Decor', 'Decor', 15, 'excellent', '50x40x5 cm', 5.0, 'Original paintings and sculptures', true, 180000.00),
('66666666-6666-6666-6666-666666666666', 'Wine Collection', 'Personal', 12, 'excellent', '30x8x8 cm', 1.5, 'Vintage wine bottles, temperature sensitive', true, 45000.00);

-- Job 7: BL-2024-007 (Pending Approval with Warehouse)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, job_type, warehouse_holding, selected_warehouse_id,
    estimated_storage_start_date, estimated_storage_end_date,
    notes, created_by, created_at, updated_at
) VALUES (
    '77777777-7777-7777-7777-777777777777',
    'BL-2024-007',
    'Rohit Patel',
    '+91 9876543216',
    'rohit.patel@email.com',
    'Satellite, Ahmedabad, Gujarat',
    'Whitefield, Bangalore, Karnataka',
    '2024-02-05',
    '2024-02-08',
    'pending',
    'warehouse_storage',
    true,
    (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1),
    '2024-02-05',
    '2024-02-07',
    'Corporate relocation, high-value equipment',
    (SELECT id FROM users WHERE username = 'checker1'),
    '2024-01-23T15:20:00Z',
    '2024-01-23T15:20:00Z'
);

-- Items for Job 7 (156 items total)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('77777777-7777-7777-7777-777777777777', 'Server Rack', 'Electronics', 1, 'excellent', '60x100x200 cm', 150.0, 'Data center equipment, climate controlled transport', true, 500000.00),
('77777777-7777-7777-7777-777777777777', 'Network Servers', 'Electronics', 4, 'excellent', '45x70x10 cm', 25.0, 'Rack mount servers, anti-static packaging', true, 800000.00),
('77777777-7777-7777-7777-777777777777', 'UPS Systems', 'Electronics', 2, 'excellent', '40x60x20 cm', 45.0, 'Uninterruptible power supply, heavy batteries', false, 150000.00),
('77777777-7777-7777-7777-777777777777', 'Workstation Computers', 'Electronics', 25, 'excellent', '20x45x40 cm', 12.0, 'High-end CAD workstations', true, 1250000.00),
('77777777-7777-7777-7777-777777777777', '4K Monitors', 'Electronics', 50, 'excellent', '60x40x20 cm', 8.0, 'Professional grade monitors', true, 750000.00),
('77777777-7777-7777-7777-777777777777', 'Office Desks (Modular)', 'Furniture', 25, 'excellent', '160x80x75 cm', 35.0, 'Height adjustable desks', false, 375000.00),
('77777777-7777-7777-7777-777777777777', 'Ergonomic Chairs', 'Furniture', 25, 'excellent', '65x65x110 cm', 18.0, 'Herman Miller Aeron chairs', false, 625000.00),
('77777777-7777-7777-7777-777777777777', 'Meeting Room Furniture', 'Furniture', 15, 'excellent', '200x100x75 cm', 60.0, 'Conference tables and chairs', false, 225000.00),
('77777777-7777-7777-7777-777777777777', 'Projectors & AV Equipment', 'Electronics', 8, 'excellent', '35x30x12 cm', 4.0, '4K projectors and sound systems', true, 320000.00),
('77777777-7777-7777-7777-777777777777', 'Office Supplies & Documentation', 'Documents', 1, 'excellent', '100x50x150 cm', 100.0, 'Bulk stationery and files', false, 25000.00);

-- Job 8: BL-2024-008 (Completed)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, notes, created_by, created_at, updated_at
) VALUES (
    '88888888-8888-8888-8888-888888888888',
    'BL-2024-008',
    'Kavya Nair',
    '+91 9876543217',
    'kavya.nair@email.com',
    'Kochi, Kerala',
    'Chennai, Tamil Nadu',
    '2024-01-30',
    '2024-02-01',
    'completed',
    'Family relocation, traditional items included',
    (SELECT id FROM users WHERE username = 'maker2'),
    '2024-01-17T12:10:00Z',
    '2024-02-01T14:20:00Z'
);

-- Items for Job 8 (28 items total)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('88888888-8888-8888-8888-888888888888', 'Teak Wood Dining Set', 'Furniture', 1, 'excellent', '180x90x75 cm', 65.0, 'Traditional Kerala teak furniture', false, 85000.00),
('88888888-8888-8888-8888-888888888888', 'Wooden Cot (Traditional)', 'Furniture', 1, 'good', '200x150x40 cm', 55.0, 'Antique wooden cot with carvings', false, 45000.00),
('88888888-8888-8888-8888-888888888888', 'Kerala Traditional Lamp', 'Decor', 3, 'excellent', '30x30x120 cm', 15.0, 'Brass traditional lamps, very delicate', true, 25000.00),
('88888888-8888-8888-8888-888888888888', 'Copper Utensils', 'Kitchen', 15, 'good', '25x25x10 cm', 2.0, 'Traditional copper cooking vessels', false, 18000.00),
('88888888-8888-8888-8888-888888888888', 'Coconut Shell Crafts', 'Decor', 8, 'excellent', '20x20x15 cm', 1.0, 'Handmade Kerala crafts', false, 4000.00),
('88888888-8888-8888-8888-888888888888', 'Spice Collection', 'Kitchen', 1, 'excellent', '40x30x20 cm', 5.0, 'Kerala spices in airtight containers', false, 3000.00);

-- Job 9: BL-2024-009 (Draft)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, notes, created_by, created_at, updated_at
) VALUES (
    '99999999-9999-9999-9999-999999999999',
    'BL-2024-009',
    'Manish Jain',
    '+91 9876543218',
    'manish.jain@email.com',
    'Indore, Madhya Pradesh',
    'Sector 56, Gurgaon, Haryana',
    '2024-02-10',
    '2024-02-12',
    'draft',
    'IT professional relocation, work from home setup',
    (SELECT id FROM users WHERE username = 'maker1'),
    '2024-01-24T16:45:00Z',
    '2024-01-24T16:45:00Z'
);

-- Items for Job 9 (73 items total)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('99999999-9999-9999-9999-999999999999', 'Gaming Setup (Complete)', 'Electronics', 1, 'excellent', '200x80x75 cm', 45.0, 'High-end gaming PC with RGB lighting', true, 250000.00),
('99999999-9999-9999-9999-999999999999', 'Ultrawide Monitor (49 inch)', 'Electronics', 1, 'excellent', '120x35x25 cm', 12.0, 'Curved gaming monitor, original packaging', true, 150000.00),
('99999999-9999-9999-9999-999999999999', 'Mechanical Keyboards', 'Electronics', 3, 'excellent', '45x15x4 cm', 1.5, 'Custom mechanical keyboards', false, 45000.00),
('99999999-9999-9999-9999-999999999999', 'Gaming Chairs', 'Furniture', 2, 'excellent', '65x65x130 cm', 25.0, 'Racing style gaming chairs', false, 60000.00),
('99999999-9999-9999-9999-999999999999', 'Home Office Desk (L-shaped)', 'Furniture', 1, 'excellent', '180x180x75 cm', 55.0, 'Corner desk for dual monitor setup', false, 35000.00),
('99999999-9999-9999-9999-999999999999', 'Server & Network Equipment', 'Electronics', 5, 'excellent', '40x30x20 cm', 8.0, 'Home lab servers and networking gear', true, 85000.00),
('99999999-9999-9999-9999-999999999999', 'Tech Books & Manuals', 'Documents', 50, 'excellent', '25x20x3 cm', 1.0, 'Programming and IT reference books', false, 15000.00),
('99999999-9999-9999-9999-999999999999', 'Cable Management & Accessories', 'Electronics', 10, 'excellent', '30x20x10 cm', 2.0, 'Professional cable management setup', false, 8000.00);

-- Job 10: BL-2024-010 (In Progress with Warehouse)
INSERT INTO jobs (
    id, job_number, client_name, client_phone, client_email,
    pickup_address, delivery_address, pickup_date, delivery_date,
    status, job_type, warehouse_holding, selected_warehouse_id,
    estimated_storage_start_date, estimated_storage_end_date,
    notes, created_by, created_at, updated_at
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'BL-2024-010',
    'Anjali Reddy',
    '+91 9876543219',
    'anjali.reddy@email.com',
    'Jubilee Hills, Hyderabad, Telangana',
    'Dwarka, New Delhi',
    '2024-02-03',
    '2024-02-06',
    'in_progress',
    'warehouse_storage',
    true,
    (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1),
    '2024-02-04',
    '2024-02-05',
    'Medical professional relocation with sensitive equipment',
    (SELECT id FROM users WHERE username = 'checker1'),
    '2024-01-22T07:30:00Z',
    '2024-02-03T11:15:00Z'
);

-- Items for Job 10 (112 items total)
INSERT INTO items (job_id, item_name, category, quantity, condition, dimensions, weight_estimate, handling_instructions, fragile, item_value) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Medical Equipment Cabinet', 'Medical', 1, 'excellent', '80x40x180 cm', 75.0, 'Secure medical equipment storage', false, 45000.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Diagnostic Instruments', 'Medical', 15, 'excellent', '30x20x15 cm', 3.0, 'Precision medical instruments, climate controlled', true, 185000.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Medical Books & Journals', 'Documents', 80, 'excellent', '25x20x3 cm', 1.2, 'Medical reference books and journals', false, 120000.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Office Furniture (Clinic)', 'Furniture', 8, 'excellent', '120x60x75 cm', 30.0, 'Patient consultation furniture', false, 85000.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Computer & Printer', 'Electronics', 3, 'excellent', '40x30x20 cm', 8.0, 'Medical practice management system', true, 125000.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Personal Household Items', 'Personal', 5, 'excellent', '50x40x30 cm', 10.0, 'Family belongings and personal items', false, 35000.00);

-- Add warehouse scheduling for jobs with warehouse entries
INSERT INTO job_schedule (
    job_id, warehouse_id, schedule_type, scheduled_date, scheduled_time_start, scheduled_time_end, status, notes
) VALUES
-- Job 1 warehouse schedule
('11111111-1111-1111-1111-111111111111', (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1), 'warehouse_in', '2024-01-25', '10:00', '12:00', 'completed', 'Items stored in climate controlled section'),
('11111111-1111-1111-1111-111111111111', (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1), 'warehouse_out', '2024-01-26', '14:00', '16:00', 'planned', 'Scheduled for delivery pickup'),

-- Job 4 warehouse schedule
('44444444-4444-4444-4444-444444444444', (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1), 'warehouse_in', '2024-02-01', '09:00', '11:00', 'planned', 'Large household items, extra space needed'),
('44444444-4444-4444-4444-444444444444', (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1), 'warehouse_out', '2024-02-02', '15:00', '17:00', 'planned', 'Next day delivery arrangement'),

-- Job 7 warehouse schedule
('77777777-7777-7777-7777-777777777777', (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1), 'warehouse_in', '2024-02-05', '08:00', '12:00', 'planned', 'Corporate equipment, security protocols needed'),
('77777777-7777-7777-7777-777777777777', (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1), 'warehouse_out', '2024-02-07', '10:00', '14:00', 'planned', 'Climate controlled transport required'),

-- Job 10 warehouse schedule
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1), 'warehouse_in', '2024-02-04', '11:00', '13:00', 'completed', 'Medical equipment, sterile handling'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM warehouses WHERE name LIKE '%Delhi%' LIMIT 1), 'warehouse_out', '2024-02-05', '16:00', '18:00', 'planned', 'Special handling for medical instruments');

-- Update the jobs table comment
COMMENT ON TABLE jobs IS 'Enhanced jobs table with warehouse support and comprehensive job management fields';

-- Create index for item count queries
CREATE INDEX IF NOT EXISTS idx_items_job_id_count ON items(job_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully populated 10 sample jobs with their items and warehouse schedules';
    RAISE NOTICE 'Total items created: %', (SELECT COUNT(*) FROM items WHERE job_id IN (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333',
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555',
        '66666666-6666-6666-6666-666666666666',
        '77777777-7777-7777-7777-777777777777',
        '88888888-8888-8888-8888-888888888888',
        '99999999-9999-9999-9999-999999999999',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    ));
END $$;