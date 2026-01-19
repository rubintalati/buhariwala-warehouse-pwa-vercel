-- Add warehouse management and multi-location support to jobs

-- Create warehouses table
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'India',
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    capacity_sqft INTEGER,
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    monthly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    operating_hours JSONB, -- {"mon": "8:00-18:00", "tue": "8:00-18:00", ...}
    facilities JSONB, -- ["climate_controlled", "security_cameras", "loading_dock"]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_locations table for multiple pickup/delivery addresses
CREATE TABLE job_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('pickup', 'delivery')),
    sequence_order INTEGER NOT NULL, -- Order in the logistics chain
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'India',
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    special_instructions TEXT,
    access_requirements TEXT, -- "elevator", "stairs only", "loading dock"
    floor_level INTEGER,
    estimated_volume_cubic_ft DECIMAL(10,2),
    estimated_weight_lbs DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_schedule table for flexible scheduling
CREATE TABLE job_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    location_id UUID REFERENCES job_locations(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id),
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('pickup', 'delivery', 'warehouse_in', 'warehouse_out')),
    scheduled_date DATE NOT NULL,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    actual_date DATE,
    actual_time_start TIME,
    actual_time_end TIME,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    assigned_team_members JSONB, -- Array of user IDs
    estimated_duration_hours DECIMAL(4,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance jobs table with warehouse and job type support
ALTER TABLE jobs ADD COLUMN job_type VARCHAR(20) DEFAULT 'direct_move'
    CHECK (job_type IN ('direct_move', 'warehouse_storage', 'multi_location'));
ALTER TABLE jobs ADD COLUMN warehouse_holding BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN selected_warehouse_id UUID REFERENCES warehouses(id);
ALTER TABLE jobs ADD COLUMN estimated_storage_start_date DATE;
ALTER TABLE jobs ADD COLUMN estimated_storage_end_date DATE;
ALTER TABLE jobs ADD COLUMN storage_cost_estimate DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN total_estimated_cost DECIMAL(12,2);

-- Create indexes for performance
CREATE INDEX idx_warehouses_active ON warehouses(is_active);
CREATE INDEX idx_warehouses_city ON warehouses(city);
CREATE INDEX idx_job_locations_job_id ON job_locations(job_id);
CREATE INDEX idx_job_locations_sequence ON job_locations(job_id, sequence_order);
CREATE INDEX idx_job_schedule_job_id ON job_schedule(job_id);
CREATE INDEX idx_job_schedule_date ON job_schedule(scheduled_date);
CREATE INDEX idx_job_schedule_warehouse ON job_schedule(warehouse_id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_locations_updated_at BEFORE UPDATE ON job_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_schedule_updated_at BEFORE UPDATE ON job_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample warehouses
INSERT INTO warehouses (name, address, city, state, contact_person, contact_phone, capacity_sqft, daily_rate, operating_hours, facilities) VALUES
('Main Warehouse Mumbai', 'Plot 15, Industrial Area, Andheri East', 'Mumbai', 'Maharashtra', 'Rajesh Kumar', '+91-9876543210', 10000, 500.00,
 '{"mon": "8:00-18:00", "tue": "8:00-18:00", "wed": "8:00-18:00", "thu": "8:00-18:00", "fri": "8:00-18:00", "sat": "8:00-14:00"}',
 '["climate_controlled", "security_cameras", "loading_dock", "24x7_security"]'),

('Secondary Storage Pune', '23, Warehouse Complex, Pimpri-Chinchwad', 'Pune', 'Maharashtra', 'Priya Sharma', '+91-8765432109', 7500, 350.00,
 '{"mon": "9:00-17:00", "tue": "9:00-17:00", "wed": "9:00-17:00", "thu": "9:00-17:00", "fri": "9:00-17:00", "sat": "9:00-13:00"}',
 '["security_cameras", "loading_dock", "pest_control"]'),

('Express Hub Delhi', '45, Logistics Park, Gurgaon Sector 18', 'Gurgaon', 'Haryana', 'Amit Singh', '+91-7654321098', 15000, 750.00,
 '{"mon": "6:00-20:00", "tue": "6:00-20:00", "wed": "6:00-20:00", "thu": "6:00-20:00", "fri": "6:00-20:00", "sat": "6:00-16:00", "sun": "10:00-14:00"}',
 '["climate_controlled", "security_cameras", "loading_dock", "24x7_security", "fire_suppression", "cctv_monitoring"]');

-- Add RLS policies for new tables

-- Warehouses policies
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all active warehouses" ON warehouses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage warehouses" ON warehouses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'super_admin'
        )
    );

-- Job locations policies
ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read locations for accessible jobs" ON job_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_locations.job_id
            AND (
                jobs.created_by::text = auth.uid()::text OR
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id::text = auth.uid()::text
                    AND users.role IN ('super_admin', 'checker')
                )
            )
        )
    );

CREATE POLICY "Users can manage locations for their jobs" ON job_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_locations.job_id
            AND jobs.created_by::text = auth.uid()::text
        )
    );

-- Job schedule policies
ALTER TABLE job_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read schedules for accessible jobs" ON job_schedule
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_schedule.job_id
            AND (
                jobs.created_by::text = auth.uid()::text OR
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id::text = auth.uid()::text
                    AND users.role IN ('super_admin', 'checker')
                )
            )
        )
    );

CREATE POLICY "Users can manage schedules for their jobs" ON job_schedule
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_schedule.job_id
            AND jobs.created_by::text = auth.uid()::text
        )
    );