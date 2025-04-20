import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config.env file
dotenv.config({ 
    path: path.join(__dirname, 'config.env')
});

export const config = {
    // Server settings
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    
    // Database configuration
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASS: process.env.DB_PASS,
    DB_NAME: process.env.DB_NAME || 'crime_record_db',
    
    // JWT configuration
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
    JWT_EXPIRE: process.env.JWT_EXPIRE || '3d',
    COOKIE_EXPIRE: parseInt(process.env.COOKIE_EXPIRE) || 3,
    
    // SMTP configuration
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_SERVICE: process.env.SMTP_SERVICE,
    SMTP_PORT: parseInt(process.env.SMTP_PORT) || 465,
    SMTP_MAIL: process.env.SMTP_MAIL,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD
};