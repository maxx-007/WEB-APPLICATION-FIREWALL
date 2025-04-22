const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const readline = require('readline');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  console.log('\n🛡️  WAF Setup for CatchPhish Application 🛡️\n');
  
  try {
    // Check if .env file already exists
    if (fs.existsSync('.env')) {
      const overwrite = await question('An .env file already exists. Overwrite? (y/n): ');
      if (overwrite.toLowerCase() !== 'y') {
        console.log('Setup canceled. Using existing .env file.');
      } else {
        await createEnvFile();
      }
    } else {
      await createEnvFile();
    }

    // Install dependencies
    console.log('\n📦 Installing dependencies...');
    try {
      if (fs.existsSync('proxy-package.json')) {
        // Copy proxy-package.json to package.json if it exists
        fs.copyFileSync('proxy-package.json', 'package.json');
        console.log('✅ Copied proxy-package.json to package.json');
      }

      await execPromise('npm install');
      console.log('✅ Dependencies installed successfully');
    } catch (error) {
      console.error('❌ Error installing dependencies:', error.message);
    }

    // Setup database
    try {
      await setupDatabase();
    } catch (error) {
      console.error('❌ Database setup error:', error.message);
    }

    console.log('\n🚀 WAF Setup Completed!');
    console.log('\nTo start the WAF proxy:');
    console.log('  npm start');
    console.log('\nOnce running, access CatchPhish through:');
    console.log('  http://localhost:8080 (or your configured port)');
    console.log('\nManage WAF through the admin interface:');
    console.log('  http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

async function createEnvFile() {
  console.log('\n📝 Creating .env file...');
  
  const proxyPort = await question('Enter proxy port (default: 8080): ') || '8080';
  const mysqlHost = await question('Enter MySQL host (default: localhost): ') || 'localhost';
  const mysqlUser = await question('Enter MySQL username: ');
  const mysqlPassword = await question('Enter MySQL password: ');
  const mysqlDatabase = await question('Enter MySQL database name (default: waf_db): ') || 'waf_db';
  const mongoUri = await question('Enter MongoDB URI (default: mongodb://localhost:27017/waf_logs): ') || 'mongodb://localhost:27017/waf_logs';
  const jwtSecret = await question('Enter JWT secret (or press enter to generate one): ') || 
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const adminPassword = await question('Enter admin password: ');
  
  const envContent = `# WAF Proxy Configuration
PROXY_PORT=${proxyPort}

# Database Configuration
MYSQL_HOST=${mysqlHost}
MYSQL_USER=${mysqlUser}
MYSQL_PASSWORD=${mysqlPassword}
MYSQL_DATABASE=${mysqlDatabase}

# MongoDB Configuration
MONGO_URI=${mongoUri}

# JWT Secret
JWT_SECRET=${jwtSecret}

# Admin credentials
ADMIN_PASSWORD=${adminPassword}
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ .env file created successfully');
}

async function setupDatabase() {
  console.log('\n🗄️  Setting up database...');
  
  // Load environment variables from .env file
  require('dotenv').config();
  
  const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
  
  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    throw new Error('Missing MySQL configuration in .env file');
  }
  
  try {
    // First connect without database to create it if it doesn't exist
    const connection = await mysql.createConnection({
      host: MYSQL_HOST,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE}`);
    console.log(`✅ Database "${MYSQL_DATABASE}" ready`);
    
    // Connect to the database
    await connection.query(`USE ${MYSQL_DATABASE}`);
    
    // Create firewall_rules table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS firewall_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rule_name VARCHAR(255) NOT NULL,
        rule_pattern TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ firewall_rules table ready');
    
    // Create blocked_ips table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS blocked_ips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45) NOT NULL,
        reason VARCHAR(255),
        blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_ip (ip)
      )
    `);
    console.log('✅ blocked_ips table ready');
    
    // Ask if user wants to import sample rules
    const importRules = await question('Import sample firewall rules for CatchPhish? (y/n): ');
    if (importRules.toLowerCase() === 'y') {
      if (fs.existsSync('catchphish-rules.sql')) {
        const rulesFile = fs.readFileSync('catchphish-rules.sql', 'utf8');
        const ruleQueries = rulesFile.split(';').filter(query => query.trim().length > 0);
        
        for (const query of ruleQueries) {
          if (query.trim().startsWith('--')) continue; // Skip comment lines
          await connection.query(query);
        }
        
        console.log('✅ Sample firewall rules imported');
      } else {
        console.log('❌ catchphish-rules.sql file not found');
      }
    }
    
    await connection.end();
    
  } catch (error) {
    throw new Error(`Database setup failed: ${error.message}`);
  }
}

// Run the setup
setup(); 