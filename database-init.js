// Database initialization script for production
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { dbPromise } = require('./config/dbMySQL');

async function initializeDatabase() {
    console.log("🔧 Initializing WAF Database for production...");
    
    try {
        // Read the SQL setup file
        const sqlFile = path.join(__dirname, 'database-setup.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Split SQL statements (simple split by semicolon)
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📊 Executing ${statements.length} SQL statements...`);
        
        // Execute each statement
        for (const statement of statements) {
            try {
                await dbPromise.execute(statement);
                console.log(`✅ Executed successfully`);
            } catch (error) {
                // Only log actual errors, not warnings about existing tables
                if (!error.message.includes('already exists') && !error.message.includes('Duplicate entry')) {
                    console.error(`❌ Error: ${error.message}`);
                } else {
                    console.log(`ℹ️  Table already exists - skipping`);
                }
            }
        }
        
        console.log("✅ Database initialization completed!");
        
        // Test the setup by counting records
        const [firewallRules] = await dbPromise.execute('SELECT COUNT(*) as count FROM firewall_rules');
        const [blockedIps] = await dbPromise.execute('SELECT COUNT(*) as count FROM blocked_ips');
        const [whitelistIps] = await dbPromise.execute('SELECT COUNT(*) as count FROM whitelist_ips');
        
        console.log(`📊 Database Statistics:`);
        console.log(`   - Firewall Rules: ${firewallRules[0].count}`);
        console.log(`   - Blocked IPs: ${blockedIps[0].count}`);
        console.log(`   - Whitelisted IPs: ${whitelistIps[0].count}`);
        
        return true;
        
    } catch (error) {
        console.error("❌ Database initialization failed:", error);
        return false;
    }
}

// Run initialization if called directly
if (require.main === module) {
    initializeDatabase()
        .then((success) => {
            if (success) {
                console.log("🎉 Database ready for production!");
                process.exit(0);
            } else {
                console.log("💥 Database initialization failed!");
                process.exit(1);
            }
        });
}

module.exports = { initializeDatabase };