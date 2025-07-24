-- WAF Database Setup Script
-- Create tables for Web Application Firewall

-- Blocked IPs table
CREATE TABLE IF NOT EXISTS blocked_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL UNIQUE,
    reason VARCHAR(255),
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_by VARCHAR(100),
    is_permanent BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NULL,
    INDEX idx_ip (ip),
    INDEX idx_blocked_at (blocked_at)
);

-- Firewall Rules table
CREATE TABLE IF NOT EXISTS firewall_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_pattern VARCHAR(1000) NOT NULL,
    rule_type ENUM('BLOCK', 'ALLOW', 'LOG') DEFAULT 'BLOCK',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_active (is_active),
    INDEX idx_type (rule_type),
    INDEX idx_severity (severity)
);

-- Whitelist IPs table
CREATE TABLE IF NOT EXISTS whitelist_ips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    INDEX idx_ip (ip)
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_blocked BOOLEAN DEFAULT FALSE,
    UNIQUE KEY unique_ip_endpoint (ip, endpoint),
    INDEX idx_ip (ip),
    INDEX idx_window (window_start)
);

-- Insert comprehensive firewall rules
INSERT IGNORE INTO firewall_rules (rule_name, rule_pattern, rule_type, description, severity) VALUES
-- SQL Injection Rules
('SQL Injection - UNION Attack', '(union\\s+(all\\s+)?select)', 'BLOCK', 'Detects UNION-based SQL injection attempts', 'CRITICAL'),
('SQL Injection - Boolean Based', '(\\s+(and|or)\\s+\\d+\\s*=\\s*\\d+)', 'BLOCK', 'Detects boolean-based SQL injection', 'HIGH'),
('SQL Injection - Time Based', '(sleep\\s*\\(|benchmark\\s*\\(|waitfor\\s+delay)', 'BLOCK', 'Detects time-based SQL injection', 'HIGH'),
('SQL Injection - Comment Injection', '(--\\s|#|/\\*|\\*/)', 'BLOCK', 'Detects SQL comment injection attempts', 'HIGH'),
('SQL Injection - Information Schema', '(information_schema|sys\\.|mysql\\.|pg_)', 'BLOCK', 'Detects database schema enumeration attempts', 'HIGH'),

-- XSS Rules
('XSS - Script Tags', '<script[^>]*>', 'BLOCK', 'Detects script tag injection', 'CRITICAL'),
('XSS - Event Handlers', 'on(load|error|click|mouseover|focus|blur)\\s*=', 'BLOCK', 'Detects JavaScript event handler injection', 'HIGH'),
('XSS - JavaScript Protocol', 'javascript\\s*:', 'BLOCK', 'Detects javascript protocol injection', 'HIGH'),
('XSS - Iframe Injection', '<iframe[^>]*>', 'BLOCK', 'Detects iframe injection attempts', 'HIGH'),
('XSS - Base64 Encoded', 'data\\s*:\\s*text\\/html\\s*;\\s*base64', 'BLOCK', 'Detects base64 encoded XSS payloads', 'HIGH'),

-- Path Traversal Rules
('Path Traversal - Directory Traversal', '(\\.\\.\\/|\\.\\.\\\\\|%2e%2e%2f|%252e%252e%252f)', 'BLOCK', 'Detects directory traversal attempts', 'HIGH'),
('Path Traversal - System Files', '(\\/etc\\/passwd|\\/proc\\/|\\/win\\.ini|c:\\\\windows)', 'BLOCK', 'Detects system file access attempts', 'CRITICAL'),
('Path Traversal - Null Bytes', '(%00|\\x00)', 'BLOCK', 'Detects null byte injection', 'HIGH'),

-- Command Injection Rules
('Command Injection - System Commands', '(;\\s*(ls|cat|wget|curl|nc|netcat|ping|nslookup)\\s)', 'BLOCK', 'Detects system command injection', 'CRITICAL'),
('Command Injection - Pipe Commands', '(\\|\\s*(ls|cat|wget|curl|nc|netcat|ping))', 'BLOCK', 'Detects piped command injection', 'CRITICAL'),
('Command Injection - Backticks', '`[^`]*`', 'BLOCK', 'Detects backtick command execution', 'HIGH'),

-- File Inclusion Rules
('LFI - Local File Inclusion', '(file\\s*:\\s*\\/\\/|php\\s*:\\/\\/)', 'BLOCK', 'Detects local file inclusion attempts', 'HIGH'),
('RFI - Remote File Inclusion', '(http\\s*:\\/\\/|https\\s*:\\/\\/|ftp\\s*:\\/\\/)', 'LOG', 'Logs remote file inclusion attempts', 'MEDIUM'),

-- Web Shell Detection
('Web Shell - PHP Functions', '(eval\\s*\\(|exec\\s*\\(|system\\s*\\(|shell_exec\\s*\\(|passthru\\s*\\()', 'BLOCK', 'Detects PHP web shell functions', 'CRITICAL'),
('Web Shell - Common Names', '(c99\\.php|r57\\.php|shell\\.php|cmd\\.php|webshell\\.php)', 'BLOCK', 'Detects common web shell file names', 'CRITICAL'),

-- API Security Rules
('API - Excessive Parameter Count', '^[^?]*\\?([^&]*&){50,}', 'BLOCK', 'Detects requests with excessive parameters', 'MEDIUM'),
('API - Large Request Body', '^.{100000,}$', 'BLOCK', 'Detects unusually large request bodies', 'MEDIUM'),

-- Bot Detection Rules
('Bot - Scanner User Agents', '(nikto|sqlmap|nmap|acunetix|w3af|skipfish|burp|zap)', 'BLOCK', 'Detects security scanner user agents', 'HIGH'),
('Bot - Automated Tools', '(curl|wget|python-requests|go-http-client)', 'LOG', 'Logs automated tool requests', 'LOW'),

-- LDAP Injection
('LDAP Injection', '(\\*\\)|\\(\\||\\(\\&|\\(\\!)', 'BLOCK', 'Detects LDAP injection attempts', 'HIGH'),

-- XML/XXE Attacks
('XXE - External Entity', '(<!ENTITY|<!DOCTYPE[^>]*ENTITY)', 'BLOCK', 'Detects XML External Entity attacks', 'HIGH'),

-- NoSQL Injection
('NoSQL Injection - MongoDB', '(\\$where|\\$ne|\\$regex|\\$gt|\\$lt)', 'BLOCK', 'Detects NoSQL injection attempts', 'HIGH'),

-- SSRF Prevention
('SSRF - Internal IP Access', '(localhost|127\\.0\\.0\\.1|192\\.168\\.|10\\.|172\\.(1[6-9]|2[0-9]|3[0-1]))', 'BLOCK', 'Prevents Server-Side Request Forgery to internal IPs', 'HIGH');

-- Insert some sample blocked IPs (remove in production)
INSERT IGNORE INTO blocked_ips (ip, reason, blocked_by) VALUES
('127.0.0.2', 'Test blocked IP', 'system'),
('192.168.1.100', 'Suspicious activity', 'admin');

-- Insert whitelist IPs
INSERT IGNORE INTO whitelist_ips (ip, description, created_by) VALUES
('127.0.0.1', 'Localhost', 'system'),
('::1', 'IPv6 localhost', 'system');