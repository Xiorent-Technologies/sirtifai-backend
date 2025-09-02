-- PostgreSQL initialization script
-- This script runs when the PostgreSQL container starts for the first time

-- Create application database
CREATE DATABASE sirtifai_db;

-- Connect to the application database
\c sirtifai_db;

-- Create application user
CREATE USER sirtifai_user WITH PASSWORD 'sirtifai_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sirtifai_db TO sirtifai_user;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    phone VARCHAR(20),
    date_of_birth DATE,
    avatar VARCHAR(500) DEFAULT 'https://via.placeholder.com/150x150?text=User',
    bio TEXT,
    website VARCHAR(255),
    location VARCHAR(100),
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    lock_until TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    social_accounts JSONB DEFAULT '{}',
    two_factor_auth JSONB DEFAULT '{"enabled": false, "secret": null, "backup_codes": []}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Create tokens table
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('access', 'refresh', 'reset_password', 'verify_email')),
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revoked_by UUID REFERENCES users(id),
    revoked_reason VARCHAR(50),
    device_info JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

CREATE INDEX idx_tokens_token ON tokens(token);
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_type ON tokens(type);
CREATE INDEX idx_tokens_user_id_type ON tokens(user_id, type);
CREATE INDEX idx_tokens_user_id_revoked ON tokens(user_id, is_revoked);
CREATE INDEX idx_tokens_type_revoked ON tokens(type, is_revoked);
CREATE INDEX idx_tokens_expires_at ON tokens(expires_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant privileges on tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sirtifai_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sirtifai_user;

-- Insert admin user
INSERT INTO users (
    first_name, 
    last_name, 
    email, 
    password, 
    role, 
    status, 
    is_email_verified
) VALUES (
    'Admin',
    'User',
    'admin@sirtifai.com',
    crypt('Admin123!', gen_salt('bf')),
    'admin',
    'active',
    TRUE
);

-- Create a function to clean expired tokens
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tokens 
    WHERE expires_at < CURRENT_TIMESTAMP 
    OR (is_revoked = TRUE AND revoked_at < CURRENT_TIMESTAMP - INTERVAL '30 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean expired tokens (requires pg_cron extension)
-- SELECT cron.schedule('clean-expired-tokens', '0 2 * * *', 'SELECT clean_expired_tokens();');

COMMIT;
