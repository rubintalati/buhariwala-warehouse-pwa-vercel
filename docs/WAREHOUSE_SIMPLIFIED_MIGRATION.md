# Simplified Warehouse Schema Migration

Run this SQL to simplify the warehouses table to only include essential fields:

```sql
-- Drop existing warehouses table and recreate with simplified structure
DROP TABLE IF EXISTS warehouses CASCADE;

-- Create simplified warehouses table
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for active warehouses
CREATE INDEX idx_warehouses_active ON warehouses(is_active);

-- Add updated_at trigger
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert simplified sample warehouses
INSERT INTO warehouses (name, address, contact_name, contact_phone) VALUES
('Main Warehouse Mumbai', 'Plot 15, Industrial Area, Andheri East, Mumbai, Maharashtra', 'Rajesh Kumar', '+91-9876543210'),
('Storage Facility Pune', '23, Warehouse Complex, Pimpri-Chinchwad, Pune, Maharashtra', 'Priya Sharma', '+91-8765432109'),
('Express Hub Delhi', '45, Logistics Park, Gurgaon Sector 18, Haryana', 'Amit Singh', '+91-7654321098');

-- Enable RLS
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for reading active warehouses
CREATE POLICY "Users can read all active warehouses" ON warehouses
    FOR SELECT USING (is_active = true);

-- Add RLS policy for super admin management
CREATE POLICY "Super admins can manage warehouses" ON warehouses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'super_admin'
        )
    );

-- Re-add foreign key constraint to jobs table
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS fk_jobs_warehouse;
ALTER TABLE jobs ADD CONSTRAINT fk_jobs_warehouse
    FOREIGN KEY (selected_warehouse_id) REFERENCES warehouses(id);
```