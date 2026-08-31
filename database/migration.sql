-- Employee Management System — fresh database migration
-- Creates the database and the `employees` table used by the application.
-- Run manually, e.g.: mysql -u root -p < /home/ubuntu/migration.sql

CREATE DATABASE IF NOT EXISTS employee_management;
USE employee_management;

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    position VARCHAR(100),
    employee_id VARCHAR(100) UNIQUE,
    phone VARCHAR(50),
    department VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    image_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
