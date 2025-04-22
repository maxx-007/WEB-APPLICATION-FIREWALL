-- CatchPhish-specific WAF protection rules
-- Run these SQL statements in your MySQL database to add protection rules

-- Prevent path traversal attacks
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Path Traversal Protection', '\\.\\.|%2e%2e|\\.\\/|\\/\\.|\\\\');

-- Block common phishing related exploits
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Phishing Kit Detection', '(config\\.php|post\\.php|grab\\.php|submit\\.php|next\\.php|result\\.php|log\\.txt)');

-- Block attempts to bypass phishing detection
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Anti-Phishing Bypass Prevention', '(phishtank|antiphishing|blockpage|security|bypass|crawler|bot)');

-- Protect file upload functionality
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('File Upload Protection', '\\.(php|phtml|php3|php4|php5|pht|sh|pl|py|jsp|asp|aspx|cgi)$');

-- Prevent JavaScript injection
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('JavaScript Injection Protection', '(javascript:|document\\.cookie|document\\.location|eval\\(|setTimeout\\(|setInterval\\(|new\\s+Function)');

-- Block common phishing site cloning attempts
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Site Cloning Protection', '(httrack|wget|curl|nikto|harvester)');

-- Prevent scraping of phishing detection database
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('API Scraping Protection', '(rapidapi|api-key|apikey|token|authorization|bearer)');

-- Block malicious redirects
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Redirect Protection', '(redirect=|url=|link=|goto=|window\\.location)');

-- Protect against common brute force patterns
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Brute Force Protection', '(hydra|brutus|ncrack|medusa|patator|crowbar)');

-- Protect the admin interface
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Admin Protection', '(\\/admin|\\/wp-admin|\\/administrator|\\/panel|\\/dashboard|\\/manage)');

-- Add a rule to check for URLs pretending to be your CatchPhish application
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('CatchPhish Impersonation', '(catchphish\\.fake|catchphish-login|catchphish\\.phishing)');

-- Add a honeypot rule to detect vulnerability scanning
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Vulnerability Scanner Detection', '(\\/config|\\/phpinfo|\\/server-status|\\/wp-config|\\/web\\.config|\\.git)');

-- Block access to common WordPress admin files that could be vulnerable
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('WordPress Protection', '(wp-config\\.php|wp-login\\.php|xmlrpc\\.php)');

-- Detect and block attempts to exfiltrate data via URL parameters
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Data Exfiltration Protection', '(select.*from|dump.*database|information_schema|outfile)');

-- Block payloads targeting Apache or Nginx specific vulnerabilities
INSERT INTO firewall_rules (rule_name, rule_pattern) 
VALUES ('Server Vulnerability Protection', '(mod_rewrite|httpoxy|shellshock|heartbleed)');

-- Custom rule for known attacker IPs (Add actual IPs when known)
-- INSERT INTO blocked_ips (ip) VALUES ('127.0.0.2');
-- INSERT INTO blocked_ips (ip) VALUES ('192.168.1.2'); 