import mysql from 'mysql2/promise';
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from config.env
dotenv.config({ 
  path: path.join(__dirname, '..', 'config', 'config.env')
});

// Create connection pool with enhanced configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // ssl: process.env.NODE_ENV === 'production' ? {
  //   rejectUnauthorized: true
  // } : false,
  // timezone: 'Z', // UTC timezone
  // multipleStatements: false, // Security: Prevent multiple statements
  // dateStrings: true // Return dates as strings
});

// Test and monitor database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Successfully connected to MySQL database!");
    
    // Test query to verify connection
    const [rows] = await connection.query('SELECT 1');
    if (rows[0]['1'] === 1) {
      console.log("Database query test successful");
    }
    
    connection.release();
  } catch (err) {
    console.error("Error connecting to database:", err.message);
    // Don't exit process here - let the application handle reconnection
  }
};

// Error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed. Attempting to reconnect...');
    testConnection();
  }
});

// Initial connection test
testConnection();

export default pool;