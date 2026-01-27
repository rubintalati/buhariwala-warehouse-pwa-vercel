-- Supabase Database Setup for Buhariwala Warehouse Management
-- Run this SQL in your Supabase SQL Editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  warehouse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  warehouse_id UUID REFERENCES warehouses(warehouse_id),
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES users(user_id),
  approved_by UUID REFERENCES users(user_id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_items table
CREATE TABLE IF NOT EXISTS job_items (
  item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  weight DECIMAL(10,2),
  dimensions VARCHAR(50),
  notes TEXT,
  room VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to verify user credentials
CREATE OR REPLACE FUNCTION verify_user_credentials(p_username TEXT, p_password TEXT)
RETURNS TABLE(
  user_id UUID,
  username VARCHAR,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  phone VARCHAR,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.user_id,
    u.username,
    u.email,
    u.full_name,
    u.role,
    u.phone,
    u.is_active
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash)
    AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role, phone)
VALUES (
  'admin',
  'admin@buhariwala.com',
  crypt('admin123', gen_salt('bf')),
  'System Administrator',
  'admin',
  '+1234567890'
) ON CONFLICT (username) DO NOTHING;

-- Insert default manager user (password: manager123)
INSERT INTO users (username, email, password_hash, full_name, role, phone)
VALUES (
  'manager',
  'manager@buhariwala.com',
  crypt('manager123', gen_salt('bf')),
  'Warehouse Manager',
  'manager',
  '+1234567891'
) ON CONFLICT (username) DO NOTHING;

-- Insert sample warehouses
INSERT INTO warehouses (name, location, description)
VALUES
  ('Main Warehouse', '123 Industrial Blvd, City', 'Primary warehouse facility'),
  ('Secondary Warehouse', '456 Storage Ave, City', 'Secondary storage facility')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create RLS policies for other tables
CREATE POLICY "Allow all operations for authenticated users" ON warehouses FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON jobs FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON job_items FOR ALL USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;