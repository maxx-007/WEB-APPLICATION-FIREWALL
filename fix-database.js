// Quick script to fix database regex patterns
// Run this once with: node fix-database.js

const { dbPromise } = require('./config/dbMySQL');
require('dotenv').config();

async function fixRegexPatterns() {
    try {
        console.log('🔧 Fixing malformed regex patterns...');
        
        // Delete malformed rule
        await dbPromise.execute(
            "DELETE FROM firewall_rules WHERE rule_name = 'NoSQL Injection - MongoDB' AND rule_pattern LIKE '%|||%'"
        );
        console.log('✅ Deleted malformed rule');
        
        // Insert corrected rule
        await dbPromise.execute(`
            INSERT IGNORE INTO firewall_rules (rule_name, rule_pattern, rule_type, description, severity) 
            VALUES ('NoSQL Injection - MongoDB', '(\\\\$where|\\\\$ne|\\\\$regex|\\\\$gt|\\\\$lt)', 'BLOCK', 'Detects NoSQL injection attempts', 'HIGH')
        `);
        console.log('✅ Inserted corrected rule');
        
        // Update any other malformed patterns
        await dbPromise.execute(`
            UPDATE firewall_rules 
            SET rule_pattern = '(\\\\$where|\\\\$ne|\\\\$regex|\\\\$gt|\\\\$lt)' 
            WHERE rule_name = 'NoSQL Injection - MongoDB' 
            AND rule_pattern != '(\\\\$where|\\\\$ne|\\\\$regex|\\\\$gt|\\\\$lt)'
        `);
        console.log('✅ Updated any remaining malformed patterns');
        
        // Verify the fix
        const [results] = await dbPromise.execute(
            "SELECT rule_name, rule_pattern FROM firewall_rules WHERE rule_name = 'NoSQL Injection - MongoDB'"
        );
        
        console.log('📊 Current NoSQL rule:');
        console.table(results);
        
        console.log('🎉 Database fix completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error fixing database:', error);
        process.exit(1);
    }
}

// Run the fix
fixRegexPatterns();