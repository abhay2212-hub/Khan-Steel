-- database_setup.sql - Khan Steel Initial Database Schema
-- Run this on your production MySQL/MariaDB server

CREATE DATABASE IF NOT EXISTS khan_steel_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE khan_steel_db;

-- Optimized Contact Submissions Table for Khan Steel
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    project_type VARCHAR(50),
    message TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    status ENUM('new', 'contacted', 'completed') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_created (created_at),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Newsletter Subscribers Logic (Optional)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('active', 'unsubscribed') DEFAULT 'active',
    ip_address VARCHAR(45),
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB;
