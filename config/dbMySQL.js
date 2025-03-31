const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB
});

db.connect(err => {
    if (err) {
        console.error("❌ MySQL Connection Error:", err);
    } else {
        console.log("✅ MySQL Connected...");
    }
});

module.exports = db;
