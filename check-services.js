const http = require('http');
const { execSync } = require('child_process');
const { spawn } = require('child_process');

console.log('🔍 Checking CatchPhish services...');

const checkService = (port, name) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      console.log(`✅ ${name} is running on port ${port} (Status: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name} is not running on port ${port}: ${err.message}`);
      resolve(false);
    });
    
    // Set timeout to 2 seconds
    req.setTimeout(2000, () => {
      req.destroy();
      console.log(`❌ ${name} connection timed out on port ${port}`);
      resolve(false);
    });
  });
};

// Check frontend (port 3001) and API (port 5001)
Promise.all([
  checkService(3001, 'CatchPhish Frontend'),
  checkService(5001, 'CatchPhish API')
]).then(([frontendRunning, apiRunning]) => {
  if (!frontendRunning && !apiRunning) {
    console.log('\n⚠️ Both CatchPhish Frontend and API are not running.');
    console.log('Please start them before running the WAF proxy.\n');
    
    const startServices = process.argv.includes('--start');
    
    if (startServices) {
      console.log('🚀 Attempting to start CatchPhish services (using --start flag)...');
      
      // You would need to customize these commands based on your actual setup
      try {
        // Try to determine if we're in the CatchPhish directory
        console.log('\nPlease provide the path to your CatchPhish project:');
        const catchphishPath = process.argv[3] || '../catchphish';
        
        console.log(`Starting services from: ${catchphishPath}`);
        
        // Start frontend and API in separate terminals
        // This is a simple example - you may need to customize based on your setup
        console.log('\nStarting CatchPhish API...');
        const apiProcess = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', `cd ${catchphishPath}/backend && npm start`]);
        
        console.log('Starting CatchPhish Frontend...');
        const frontendProcess = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', `cd ${catchphishPath}/frontend && npm start`]);
        
        console.log('\n✅ Service startup commands issued. Please check the new terminal windows.');
        console.log('   Wait for services to fully start, then run the WAF proxy again.');
      } catch (error) {
        console.error('❌ Error starting services:', error.message);
      }
    } else {
      console.log('\nTo start services automatically, run:');
      console.log('node check-services.js --start [path-to-catchphish]');
    }
  } else if (!frontendRunning) {
    console.log('\n⚠️ CatchPhish Frontend is not running.');
    console.log('The WAF proxy needs both services to function correctly.');
  } else if (!apiRunning) {
    console.log('\n⚠️ CatchPhish API is not running.');
    console.log('The WAF proxy needs both services to function correctly.');
  } else {
    console.log('\n✅ All CatchPhish services are running!');
    console.log('You can now start the WAF proxy:\n');
    console.log('npm start');
  }
}); 