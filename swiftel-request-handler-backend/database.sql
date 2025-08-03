-- Create new DB
CREATE DATABASE swiftel_request_handler_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Select the DB
USE swiftel_request_handler_db;

-- Roles Table
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Requests Table
CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('monetary', 'non-monetary') NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Decisions Table
CREATE TABLE decisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  board_member_id INT NOT NULL,
  decision ENUM('approved', 'rejected') NOT NULL,
  decided_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (request_id, board_member_id),
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (board_member_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

--Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

-- Optional: Indexes for performance
CREATE INDEX idx_user_role ON users(role_id);
CREATE INDEX idx_request_creator ON requests(created_by);
CREATE INDEX idx_decision_request_board ON decisions(request_id, board_member_id);
