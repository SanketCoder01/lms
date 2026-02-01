CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  password_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password_reset_required BOOLEAN DEFAULT FALSE,
  job_title VARCHAR(100),
  location VARCHAR(100),
  profile_image VARCHAR(255),
  status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  address TEXT,
  project_type VARCHAR(100),
  calculation_type ENUM('Super Area', 'Covered Area', 'Carpet Area') DEFAULT 'Super Area',
  total_floors INT DEFAULT 0,
  total_project_area DECIMAL(10, 2) DEFAULT 0.00,
  project_image VARCHAR(255),
  description TEXT,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  unit_number VARCHAR(50) NOT NULL,
  floor_number VARCHAR(50),
  block_tower VARCHAR(50),
  super_area DECIMAL(10, 2),
  carpet_area DECIMAL(10, 2),
  covered_area DECIMAL(10, 2),
  builtup_area DECIMAL(10, 2),
  unit_condition ENUM('fully_fitted', 'semi_fitted', 'bare_shell') DEFAULT 'bare_shell',
  plc ENUM('front_facing', 'corner', 'park_facing', 'road_facing'),
  projected_rent DECIMAL(12, 2),
  status ENUM('vacant', 'occupied', 'under_maintenance', 'reserved') DEFAULT 'vacant',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS unit_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS owners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(50),
  company_name VARCHAR(255),
  tax_id VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS owner_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  unit_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS owner_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  document_type VARCHAR(100),
  document_path VARCHAR(255),
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS owner_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  subject VARCHAR(255),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  legal_entity_type VARCHAR(100),
  registration_no VARCHAR(100),
  industry VARCHAR(100),
  tax_id VARCHAR(100),
  id_type VARCHAR(50),
  contact_person_name VARCHAR(150),
  contact_person_email VARCHAR(150),
  contact_person_phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(50),
  country VARCHAR(100),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  unit_id INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sub_tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  registration_no VARCHAR(100),
  industry VARCHAR(100),
  contact_person VARCHAR(150),
  email VARCHAR(150),
  phone VARCHAR(50),
  allotted_area DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  unit_id INT,
  owner_id INT,
  tenant_id INT,
  sub_tenant_id INT,
  lease_type ENUM('Direct lease', 'Subtenant lease') DEFAULT 'Direct lease',
  rent_model ENUM('Fixed', 'Revenue Share') DEFAULT 'Fixed',
  sub_lease_area_sqft DECIMAL(10,2),
  lease_start DATE,
  lease_end DATE,
  rent_commencement_date DATE,
  fitout_period_end DATE,
  tenure_months INT,
  lockin_period_months INT,
  notice_period_months INT,
  monthly_rent DECIMAL(15, 2),
  cam_charges DECIMAL(15, 2),
  billing_frequency VARCHAR(50),
  payment_due_day VARCHAR(50),
  currency_code VARCHAR(10) DEFAULT 'INR',
  security_deposit DECIMAL(15, 2),
  utility_deposit DECIMAL(15, 2),
  deposit_type VARCHAR(50),
  revenue_share_percentage DECIMAL(5, 2),
  revenue_share_applicable_on VARCHAR(50),
  status ENUM('draft', 'pending_approval', 'approved', 'active', 'terminated', 'expired') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (owner_id) REFERENCES owners(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (sub_tenant_id) REFERENCES sub_tenants(id)
);

CREATE TABLE IF NOT EXISTS lease_escalations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lease_id INT NOT NULL,
  sequence_no INT,
  effective_from DATE,
  effective_to DATE,
  increase_type ENUM('Percentage', 'Fixed Amount') DEFAULT 'Percentage',
  value DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255),
  module VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255),
  company_logo VARCHAR(255),
  theme_color VARCHAR(50),
  currency VARCHAR(10) DEFAULT 'INR',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('project', 'unit', 'tenant', 'owner') NOT NULL,
  entity_id INT,
  document_type VARCHAR(100),
  file_path VARCHAR(255) NOT NULL,
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
