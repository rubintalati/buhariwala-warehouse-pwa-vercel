-- Enable Row Level Security
-- Note: JWT secret is configured in Supabase dashboard

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'checker', 'maker')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    move_date DATE,
    truck_vehicle_no VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'in_progress', 'completed')),
    created_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ
);

-- Create rooms table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    room_name VARCHAR(255) NOT NULL,
    room_type VARCHAR(20) NOT NULL CHECK (room_type IN ('living_room', 'bedroom', 'kitchen', 'bathroom', 'dining_room', 'office', 'storage', 'other')),
    floor_level INTEGER,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(20) NOT NULL CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
    material VARCHAR(255),
    dimensions VARCHAR(255),
    weight_estimate DECIMAL(10,2),
    handling_instructions TEXT,
    fragile BOOLEAN DEFAULT false,
    ai_confidence_score DECIMAL(3,2),
    manual_verification BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create item_images table
CREATE TABLE item_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('main', 'detail', 'damage')),
    ai_analysis_data JSONB,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create client_signatures table
CREATE TABLE client_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    signature_type VARCHAR(20) NOT NULL CHECK (signature_type IN ('pickup', 'delivery')),
    signature_data TEXT NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    signed_by_user UUID NOT NULL REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_number ON jobs(job_number);
CREATE INDEX idx_rooms_job_id ON rooms(job_id);
CREATE INDEX idx_items_room_id ON items(room_id);
CREATE INDEX idx_item_images_item_id ON item_images(item_id);
CREATE INDEX idx_client_signatures_job_id ON client_signatures(job_id);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_signatures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users table policies
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Super admins can read all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'super_admin'
        )
    );

CREATE POLICY "Super admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'super_admin'
        )
    );

-- Jobs table policies
CREATE POLICY "Users can read jobs they created or jobs assigned to their role" ON jobs
    FOR SELECT USING (
        created_by::text = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('super_admin', 'checker')
        )
    );

CREATE POLICY "Makers can create jobs" ON jobs
    FOR INSERT WITH CHECK (
        auth.uid()::text = created_by::text AND
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'maker'
        )
    );

CREATE POLICY "Users can update their own draft jobs" ON jobs
    FOR UPDATE USING (
        created_by::text = auth.uid()::text AND status = 'draft'
    );

CREATE POLICY "Checkers can approve/reject jobs" ON jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role IN ('checker', 'super_admin')
        )
    );

-- Rooms table policies
CREATE POLICY "Users can read rooms for accessible jobs" ON rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = rooms.job_id
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

CREATE POLICY "Users can manage rooms for their jobs" ON rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = rooms.job_id
            AND jobs.created_by::text = auth.uid()::text
        )
    );

-- Items table policies
CREATE POLICY "Users can read items for accessible rooms" ON items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN jobs ON jobs.id = rooms.job_id
            WHERE rooms.id = items.room_id
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

CREATE POLICY "Users can manage items for their rooms" ON items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM rooms
            JOIN jobs ON jobs.id = rooms.job_id
            WHERE rooms.id = items.room_id
            AND jobs.created_by::text = auth.uid()::text
        )
    );

-- Item images table policies
CREATE POLICY "Users can read images for accessible items" ON item_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM items
            JOIN rooms ON rooms.id = items.room_id
            JOIN jobs ON jobs.id = rooms.job_id
            WHERE items.id = item_images.item_id
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

CREATE POLICY "Users can manage images for their items" ON item_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM items
            JOIN rooms ON rooms.id = items.room_id
            JOIN jobs ON jobs.id = rooms.job_id
            WHERE items.id = item_images.item_id
            AND jobs.created_by::text = auth.uid()::text
        )
    );

-- Client signatures table policies
CREATE POLICY "Users can read signatures for accessible jobs" ON client_signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = client_signatures.job_id
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

CREATE POLICY "Users can create signatures for their jobs" ON client_signatures
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = client_signatures.job_id
            AND jobs.created_by::text = auth.uid()::text
        ) AND
        signed_by_user::text = auth.uid()::text
    );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create functions for user management
CREATE OR REPLACE FUNCTION create_user_with_password(
    p_username VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR,
    p_full_name VARCHAR,
    p_role VARCHAR,
    p_phone VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    INSERT INTO users (username, email, password_hash, full_name, role, phone)
    VALUES (p_username, p_email, crypt(p_password, gen_salt('bf')), p_full_name, p_role, p_phone)
    RETURNING id INTO user_id;

    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify user credentials
CREATE OR REPLACE FUNCTION verify_user_credentials(
    p_username VARCHAR,
    p_password VARCHAR
) RETURNS TABLE(
    user_id UUID,
    username VARCHAR,
    email VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.username, u.email, u.full_name, u.role, u.is_active
    FROM users u
    WHERE u.username = p_username
      AND u.password_hash = crypt(p_password, u.password_hash)
      AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create initial super admin user (username: admin, password: admin123)
SELECT create_user_with_password(
    'admin',
    'admin@buhariwala.com',
    'admin123',
    'System Administrator',
    'super_admin',
    NULL
);