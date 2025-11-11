-- =============================================
-- Study Abroad Management System - DDL File
-- =============================================

-- ========================
-- ROLES TABLE
-- ========================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- USERS TABLE
-- ========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- REFRESH TOKENS TABLE (For JWT Auth)
-- ========================
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- COUNTRIES TABLE
-- ========================
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(3) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- UNIVERSITIES TABLE
-- ========================
CREATE TABLE universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country_id INTEGER REFERENCES countries(id) ON DELETE RESTRICT,
    website VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    ranking INTEGER,
    tuition_fee_range VARCHAR(100),
    intake_months JSONB,
    application_deadline INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- STUDENTS TABLE
-- ========================
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    nationality VARCHAR(100),
    passport_number VARCHAR(50) UNIQUE,
    passport_expiry DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    has_english_test BOOLEAN DEFAULT FALSE,
    english_test_type VARCHAR(20) CHECK (english_test_type IN ('ielts', 'toefl', 'pte', 'duolingo', 'none')),
    english_test_score VARCHAR(50),
    english_test_date DATE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- ACADEMIC QUALIFICATIONS TABLE
-- ========================
CREATE TABLE academic_qualifications (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    education_level VARCHAR(100) NOT NULL,
    institution_name VARCHAR(255) NOT NULL,
    program_name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    grade VARCHAR(50),
    gpa DECIMAL(3,2),
    is_completed BOOLEAN DEFAULT TRUE,
    document_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- APPLICATION STATUSES TABLE
-- ========================
CREATE TABLE application_statuses (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- APPLICATIONS TABLE
-- ========================
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    application_ref VARCHAR(100) UNIQUE NOT NULL,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    university_id INTEGER REFERENCES universities(id) ON DELETE RESTRICT,
    intended_program VARCHAR(255) NOT NULL,
    intake_year INTEGER NOT NULL,
    intake_month VARCHAR(20) NOT NULL,
    application_status_id INTEGER REFERENCES application_statuses(id),
    assigned_agent_id INTEGER REFERENCES users(id),
    application_fee DECIMAL(10,2) DEFAULT 0,
    fee_paid BOOLEAN DEFAULT FALSE,
    submission_date DATE,
    decision_date DATE,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- APPLICATION DOCUMENTS TABLE
-- ========================
CREATE TABLE application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- APPLICATION COMMUNICATIONS TABLE
-- ========================
CREATE TABLE application_communications (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    communication_type VARCHAR(50) NOT NULL CHECK (communication_type IN ('email', 'call', 'meeting', 'note')),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    next_follow_up DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================
-- INDEXES FOR PERFORMANCE
-- ========================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_universities_country_id ON universities(country_id);
CREATE INDEX idx_students_created_by ON students(created_by);
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_academic_qualifications_student_id ON academic_qualifications(student_id);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_university_id ON applications(university_id);
CREATE INDEX idx_applications_status_id ON applications(application_status_id);
CREATE INDEX idx_applications_assigned_agent_id ON applications(assigned_agent_id);
CREATE INDEX idx_applications_created_by ON applications(created_by);
CREATE INDEX idx_application_documents_application_id ON application_documents(application_id);
CREATE INDEX idx_application_communications_application_id ON application_communications(application_id);
CREATE INDEX idx_application_communications_user_id ON application_communications(user_id);

-- ========================
-- DEFAULT DATA
-- ========================
INSERT INTO roles (name, description, permissions) VALUES
('superAdmin', 'Super Administrator with full system access', '{"all": true}'),
('admin', 'Administrator with management privileges', '{"users": ["read", "write"], "students": ["read", "write"], "applications": ["read", "write"]}'),
('agent', 'Agent who manages student applications', '{"students": ["read", "write"], "applications": ["read", "write"]}'),
('employee', 'Employee with limited access', '{"students": ["read"], "applications": ["read"]}');

INSERT INTO application_statuses (status, description) VALUES
('draft', 'Application is being prepared'),
('submitted', 'Application submitted to university'),
('under_review', 'University is reviewing application'),
('additional_docs_required', 'University requested additional documents'),
('interview_scheduled', 'Interview scheduled with university'),
('accepted', 'Application accepted by university'),
('rejected', 'Application rejected by university'),
('waitlisted', 'Application waitlisted'),
('withdrawn', 'Application withdrawn by student');

-- ========================
-- UPDATE TRIGGERS
-- ========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_universities_updated_at 
    BEFORE UPDATE ON universities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- COMMENTS ON TABLES
-- ========================
COMMENT ON TABLE roles IS 'Stores user roles and permissions for the system';
COMMENT ON TABLE users IS 'Stores system users (admins, agents, employees)';
COMMENT ON TABLE refresh_tokens IS 'Stores JWT refresh tokens for authentication';
COMMENT ON TABLE countries IS 'Stores available countries for study abroad';
COMMENT ON TABLE universities IS 'Stores university information and details';
COMMENT ON TABLE students IS 'Stores student personal and contact information';
COMMENT ON TABLE academic_qualifications IS 'Stores student academic qualifications and certificates';
COMMENT ON TABLE application_statuses IS 'Stores possible application status values';
COMMENT ON TABLE applications IS 'Stores student applications to universities';
COMMENT ON TABLE application_documents IS 'Stores documents uploaded for applications';
COMMENT ON TABLE application_communications IS 'Stores communication history for applications';
