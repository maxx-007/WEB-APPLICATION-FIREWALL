# WAF Protection for CatchPhish

This guide explains how to integrate the Web Application Firewall (WAF) with your CatchPhish application running on port 3001.

## Overview

The WAF acts as a security layer that sits between your application and potential attackers. It analyzes incoming requests and blocks malicious traffic based on predefined rules.

## Architecture

```
[Internet] → [WAF Proxy (Port 8080)] → [CatchPhish App (Port 3001)]
```

All external traffic is first processed by the WAF proxy which:
1. Inspects requests for malicious patterns
2. Blocks suspicious requests
3. Logs all traffic and attacks
4. Forwards legitimate requests to your CatchPhish application

## Setup Instructions

### 1. Install Dependencies

```bash
# Copy the proxy-package.json to package.json
cp proxy-package.json package.json

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env` file with the following variables:

```
# Proxy Configuration
PROXY_PORT=8080

# Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=waf_db

# MongoDB Configuration for logging
MONGO_URI=mongodb://localhost:27017/waf_logs

# JWT Secret for authentication
JWT_SECRET=your_secret_key

# Admin credentials
ADMIN_PASSWORD=strong_admin_password
```

### 3. Start the Proxy Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### 4. Access Your Application

Instead of accessing your CatchPhish application directly at `http://localhost:3001`, users should now access it via the WAF proxy at `http://localhost:8080`.

## Managing Firewall Rules

1. Log in to the WAF frontend at `http://localhost:3000`
2. Navigate to "Firewall Rules" to add, edit, or delete protection rules
3. View blocked attacks in the "Attack Logs" section
4. Monitor traffic in the "Live Traffic" section

## Security Features

The WAF provides:

- SQL Injection protection
- XSS Attack prevention
- Rate limiting (DDoS protection)
- IP blocklist management
- User-agent filtering
- Custom rule creation

## Production Deployment

For production:

1. Use HTTPS with valid SSL certificates
2. Configure your DNS to point to the WAF proxy server
3. Set the proxy to run on standard ports (80/443)
4. Set up proper firewall rules to restrict direct access to your CatchPhish application (port 3001)

## Troubleshooting

If legitimate requests are being blocked:
1. Check the WAF logs to identify which rule is blocking the request
2. Modify or disable the rule if necessary
3. Add the client IP to the allowlist if appropriate

For assistance, contact the security team. 