# CatchPhish WAF Integration Guide

This guide explains how to integrate the Web Application Firewall (WAF) with your CatchPhish application to protect it from attacks.

## System Architecture

```
[Internet] → [WAF Proxy :8080] → [CatchPhish Frontend :3001] → [CatchPhish API :5001]
```

The WAF proxy sits between external users and your CatchPhish application, inspecting all requests for potential threats and blocking malicious traffic.

## Setup Instructions

### 1. Prerequisites

Before starting, ensure you have:
- Node.js and npm installed
- MySQL database server running
- MongoDB server running
- CatchPhish application code

### 2. Install Dependencies

```bash
# Navigate to the WAF directory
cd waf-defender

# Install dependencies
npm install
```

### 3. Configure Environment

Create a `.env` file with the following settings:

```
# WAF Proxy Configuration
PROXY_PORT=8080

# Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=waf_db

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/waf_logs

# JWT Secret
JWT_SECRET=generate_a_random_string_here

# Admin credentials
ADMIN_PASSWORD=strong_admin_password
```

### 4. Set Up Database

Run the setup script to create necessary database tables:

```bash
node setup.js
```

This will:
- Create the `waf_db` database in MySQL
- Set up tables for firewall rules and blocked IPs
- Import sample rules designed to protect phishing detection apps

### 5. Verify CatchPhish Services

Before starting the WAF, make sure your CatchPhish application is running:

```bash
# Check if CatchPhish services are running
npm run check

# To automatically start CatchPhish services (optional)
npm run start-all ../path-to-catchphish
```

### 6. Start the WAF Proxy

Start the WAF proxy to protect your CatchPhish application:

```bash
# Start the WAF proxy
npm start

# Or check services first, then start
npm run check-and-start
```

### 7. Access Your Protected Application

Instead of accessing CatchPhish directly, users should now access it through the WAF:

```
http://localhost:8080
```

## How CORS Is Handled

The WAF proxy is configured to handle CORS issues between:
- CatchPhish Frontend (port 3001)
- CatchPhish API (port 5001)
- WAF Proxy (port 8080)

The proxy:
1. Forwards frontend requests to port 3001
2. Routes API requests (/api/*) to port 5001
3. Maintains necessary CORS headers to allow communication

## Security Features

The WAF provides:

1. **Attack Detection**:
   - SQL Injection protection
   - XSS Attack prevention
   - Path traversal protection

2. **Traffic Management**:
   - Rate limiting to prevent DDoS
   - IP blocklisting for repeat offenders
   - User-agent filtering for malicious tools

3. **Monitoring**:
   - All traffic is logged
   - Attack attempts are recorded
   - Access to WAF dashboard

## Troubleshooting

### CORS Issues
If you still encounter CORS issues:
1. Make sure all three components are running (WAF, Frontend, API)
2. Check that you're accessing the application through the WAF at port 8080
3. Verify that the API routes are correctly configured to be proxied

### Database Connection Errors
If the WAF can't connect to the database:
1. Check your MySQL credentials in the `.env` file
2. Ensure the MySQL server is running
3. Verify the `waf_db` database exists

### Service Communication Errors
If services can't communicate:
1. Run `npm run check` to verify all services are running
2. Check if ports 3001 and 5001 are actually used by your CatchPhish app
3. If ports are different, update the proxy.js file to match your setup

## Managing WAF Rules

To manage firewall rules:
1. Access the WAF admin dashboard at `http://localhost:3000`
2. Log in with your admin credentials
3. Navigate to "Firewall Rules" to add, edit, or delete rules
4. View attack logs in the "Attack Logs" section

## Production Deployment

For a production environment:
1. Set up HTTPS with valid certificates
2. Configure proper server firewalls
3. Use production database servers
4. Set appropriate rate limits for your traffic patterns 