const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Root",
  database: process.env.DB_NAME || "smart_farm",
  connectionLimit: 10, // ป้องกันการเชื่อมต่อมากเกินไป
});

// เชื่อมต่อฐานข้อมูล
db.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database Connection Failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL");
  connection.release();
});

module.exports = db;
