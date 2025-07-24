// Production startup script
require('dotenv').config();
const { initializeDatabase } = require('./database-init');

async function startApplication() {
    console.log('🚀 Starting WAF Application...');
    
    try {
        // Initialize database in production
        const dbInitialized = await initializeDatabase();
        
        if (!dbInitialized) {
            console.error('❌ Database initialization failed');
            process.exit(1);
        }
        
        // Start the main server
        require('./server.js');
        
    } catch (error) {
        console.error('❌ Application startup failed:', error);
        process.exit(1);
    }
}

startApplication();