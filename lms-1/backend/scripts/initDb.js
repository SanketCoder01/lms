const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = require('../config/db');

const createTables = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to database. Initializing tables...");

    try {
      // 1. ROLES
      await connection.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          role_name VARCHAR(50) NOT NULL UNIQUE
        )
      `);

      // Fix for existing table without role_name
      try {
        await connection.query("ALTER TABLE roles ADD COLUMN role_name VARCHAR(50) UNIQUE");
        console.log("Added role_name column to roles table.");
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') {
          console.log("Note: Could not add role_name column (might exist?):", e.message);
        }
      }

      // Seed roles if empty
      const [roles] = await connection.query("SELECT * FROM roles");
      if (roles.length === 0) {
        await connection.query(`
          INSERT INTO roles (name, role_name) VALUES 
          ('Admin', 'Admin'), ('User', 'User'), ('Manager', 'Manager'), ('Lease Manager', 'Lease Manager')
        `);
        console.log("Seeded roles.");
      }

      // 2. USERS
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          first_name VARCHAR(50),
          last_name VARCHAR(50),
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role_id INT,
          status VARCHAR(20) DEFAULT 'active',
          role_name VARCHAR(50), 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
        )
      `);

      // 3. PROJECTS
      await connection.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_name VARCHAR(100) NOT NULL,
          project_image VARCHAR(255),
          location VARCHAR(100),
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 4. OWNERS
      await connection.query(`
        CREATE TABLE IF NOT EXISTS owners (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100),
          email VARCHAR(100),
          phone VARCHAR(20),
          alternative_contact VARCHAR(20),
          representative_name VARCHAR(100),
          representative_phone VARCHAR(20),
          representative_email VARCHAR(100),
          address TEXT,
          total_owned_area DECIMAL(10, 2) DEFAULT 0,
          gst_number VARCHAR(50),
          kyc_status VARCHAR(20) DEFAULT 'Pending',
          kyc_document_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Fix for existing owners table - Migration
      const addColumn = async (colDef) => {
        try {
          await connection.query(`ALTER TABLE owners ADD COLUMN ${colDef}`);
          console.log(`Added column: ${colDef}`);
        } catch (e) {
          // Ignore duplicate column error (Code 1060)
          if (e.code !== 'ER_DUP_FIELDNAME') {
            console.log(`Note: Could not add column ${colDef}: ${e.message}`);
          }
        }
      };

      await addColumn("name VARCHAR(100)");
      await addColumn("alternative_contact VARCHAR(20)");
      await addColumn("representative_name VARCHAR(100)");
      await addColumn("representative_phone VARCHAR(20)");
      await addColumn("representative_email VARCHAR(100)");
      await addColumn("total_owned_area DECIMAL(10, 2) DEFAULT 0");
      await addColumn("gst_number VARCHAR(50)");

      // 5. UNITS
      await connection.query(`
        CREATE TABLE IF NOT EXISTS units (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT,
          owner_id INT,
          unit_number VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'Vacant',
          size_sqft INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL
        )
      `);

      // 6. TENANTS
      await connection.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100),
          phone VARCHAR(20),
          status VARCHAR(20) DEFAULT 'Active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 7. LEASES
      await connection.query(`
        CREATE TABLE IF NOT EXISTS leases (
          id INT AUTO_INCREMENT PRIMARY KEY,
          lease_id VARCHAR(50) UNIQUE,
          unit_id INT,
          tenant_id INT,
          start_date DATE,
          term_end DATE,
          monthly_rent DECIMAL(10, 2),
          status VARCHAR(20) DEFAULT 'active',
          rent_model VARCHAR(50),
          lease_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
          FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
        )
      `);

      // 8. DOCUMENTS (Fixing 500 error)
      await connection.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT,
          category VARCHAR(50),
          file_path VARCHAR(255),
          uploaded_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
          FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // 9. NOTIFICATIONS
      await connection.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type VARCHAR(50),
          message TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("All tables checked/created successfully.");

    } catch (err) {
      console.error("Error creating tables:", err);
    } finally {
      connection.release();
      process.exit();
    }

  } catch (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
};

createTables();
