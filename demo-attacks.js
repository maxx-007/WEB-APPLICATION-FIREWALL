/**
 * WAF Attack Demonstration Script
 * For educational and testing purposes only
 */

const demoAttacks = {
  /**
   * SQL Injection Attack Examples
   * These demonstrate common SQL injection patterns that will be detected by the WAF
   */
  sqlInjection: [
    // Basic SQL injection attacks
    "' OR '1'='1", // Classic bypass
    "'; DROP TABLE users; --", // Destructive command
    "admin' --", // Comment out remainder of query
    "' UNION SELECT username, password FROM users --", // Union attack
    "' OR 1=1; --", // Always true condition
    
    // URLs for testing
    "http://localhost:8080/api/users?id=1' OR '1'='1", // Parameter-based
    "http://localhost:8080/api/search?query=test' UNION SELECT * FROM users --", // Union attack
    "http://localhost:8080/login?username=admin'--&password=anything", // Login bypass
  ],
  
  /**
   * XSS (Cross-Site Scripting) Attack Examples
   * These demonstrate common XSS vectors that will be detected by the WAF
   */
  xss: [
    // Basic XSS payloads
    "<script>alert('XSS')</script>",
    "<img src=\"x\" onerror=\"alert('XSS')\">",
    "<body onload=\"alert('XSS')\">",
    "javascript:alert('XSS')",
    
    // URLs for testing
    "http://localhost:8080/api/search?query=<script>alert('XSS')</script>",
    "http://localhost:8080/api/comments?text=<img src=\"x\" onerror=\"alert('XSS')\">"
  ],
  
  /**
   * Path Traversal Attack Examples
   * These demonstrate attempts to access files outside permitted directories
   */
  pathTraversal: [
    // Basic path traversal
    "../../../etc/passwd",
    "..\\..\\..\\Windows\\system.ini",
    "%2e%2e/%2e%2e/%2e%2e/etc/passwd", // URL encoded
    
    // URLs for testing
    "http://localhost:8080/api/files?path=../../../etc/passwd",
    "http://localhost:8080/api/download?file=..\\..\\..\\Windows\\system.ini"
  ]
};

/**
 * How to use during presentation:
 * 
 * 1. SQL Injection Demo:
 *    - Show login form at http://localhost:8080/login
 *    - Try to log in with username: admin' OR '1'='1 and any password
 *    - WAF will detect and redirect to block.html
 * 
 * 2. XSS Demo:
 *    - Visit search page and enter: <script>alert('XSS')</script>
 *    - WAF will detect and redirect to block.html
 * 
 * 3. Path Traversal Demo:
 *    - Try accessing: http://localhost:8080/api/files?path=../../../etc/passwd
 *    - WAF will detect and redirect to block.html
 */

// Export for Node.js, ignore in browser
if (typeof module !== 'undefined') {
  module.exports = demoAttacks;
}

console.log("WAF Attack Demo Vectors Loaded");
console.log("Please use these examples for educational purposes only!"); 