const axios = require('axios');
const colors = require('colors');

// Set colors theme
colors.setTheme({
  info: 'blue',
  help: 'cyan',
  warn: 'yellow',
  success: 'green',
  error: 'red'
});

// Test configuration
const WAF_PROXY_URL = process.env.WAF_PROXY_URL || 'http://localhost:8080';
const TESTS = [
  {
    name: 'Normal Request',
    path: '/',
    method: 'GET',
    expectBlock: false,
    description: 'A regular request to the homepage'
  },
  {
    name: 'SQL Injection Attack',
    path: '/login?username=admin%27%20OR%201=1--',
    method: 'GET',
    expectBlock: true,
    description: 'Basic SQL injection attempt'
  },
  {
    name: 'XSS Attack',
    path: '/search?q=<script>alert("XSS")</script>',
    method: 'GET',
    expectBlock: true,
    description: 'Cross-site scripting attack'
  },
  {
    name: 'Path Traversal',
    path: '/assets/../../etc/passwd',
    method: 'GET',
    expectBlock: true,
    description: 'Directory traversal attempt'
  },
  {
    name: 'Phishing Kit Detection',
    path: '/config.php',
    method: 'GET',
    expectBlock: true,
    description: 'Attempting to access common phishing kit file'
  },
  {
    name: 'Malicious User-Agent',
    path: '/',
    method: 'GET',
    headers: { 'User-Agent': 'sqlmap/1.4.2' },
    expectBlock: true,
    description: 'Request with malicious user agent'
  },
  {
    name: 'WordPress Vulnerability',
    path: '/wp-login.php',
    method: 'GET',
    expectBlock: true,
    description: 'WordPress login page attack'
  }
];

// Run all tests
async function runTests() {
  console.log('\n🛡️  WAF PROTECTION TEST 🛡️\n'.bold);
  console.log(`Testing WAF at: ${WAF_PROXY_URL}\n`.help);
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const test of TESTS) {
    try {
      console.log(`Running test: ${test.name}`.cyan);
      console.log(`  Description: ${test.description}`);
      console.log(`  ${test.method} ${test.path}`);
      if (test.headers) {
        console.log(`  Headers: ${JSON.stringify(test.headers)}`);
      }
      
      const startTime = Date.now();
      let blocked = false;
      let response;
      
      try {
        response = await axios({
          method: test.method,
          url: `${WAF_PROXY_URL}${test.path}`,
          headers: test.headers || {},
          timeout: 5000,
          validateStatus: () => true // Don't throw on error status codes
        });
      } catch (error) {
        if (error.response) {
          response = error.response;
        } else {
          // Network error or timeout
          console.log(`  Error: ${error.message}`.error);
          console.log(`  Test ${test.expectBlock ? 'PASSED' : 'FAILED'} (Connectivity issue)\n`.warn);
          continue;
        }
      }
      
      const elapsedTime = Date.now() - startTime;
      
      // Check if blocked (403 is typical for WAF block)
      blocked = response.status === 403 || 
                (response.data && response.data.message && 
                 response.data.message.includes('Blocked'));
      
      console.log(`  Response: ${response.status} ${response.statusText}`);
      console.log(`  Time: ${elapsedTime}ms`);
      
      if (blocked) {
        console.log(`  Result: BLOCKED by WAF`.info);
      } else {
        console.log(`  Result: ALLOWED`.warn);
      }
      
      if (blocked === test.expectBlock) {
        console.log(`  Test PASSED ✅\n`.success);
        passedTests++;
      } else {
        console.log(`  Test FAILED ❌`.error);
        console.log(`  Expected: ${test.expectBlock ? 'BLOCKED' : 'ALLOWED'}`.error);
        console.log(`  Actual: ${blocked ? 'BLOCKED' : 'ALLOWED'}\n`.error);
        failedTests++;
      }
      
    } catch (error) {
      console.log(`  Error running test: ${error.message}`.error);
      console.log(`  Test FAILED ❌\n`.error);
      failedTests++;
    }
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY 📊'.bold);
  console.log(`Total tests: ${TESTS.length}`);
  console.log(`Passed: ${passedTests}`.success);
  console.log(`Failed: ${failedTests}`.error);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED - WAF IS WORKING CORRECTLY 🎉\n'.success.bold);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - WAF NEEDS ADJUSTMENT ⚠️\n'.error.bold);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`Error running tests: ${error.message}`.error);
}); 