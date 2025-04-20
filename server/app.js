import express from "express";
import { config } from "dotenv";

import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from 'url';
import path from 'path';
import db from "./database/db.js";
import { errorMiddleware } from "./middlewares/errormiddlewares.js";
import { globalLimiter, authLimiter } from "./middlewares/rateLimit.js";
import compression from 'compression';
import winston from 'winston';

// Route imports
import authRouter from "./routes/authRouter.js";
import victimRouter from "./routes/victimRouter.js";
import suspectRouter from "./routes/suspectRouter.js";
import witnessRouter from "./routes/witnessRouter.js";
import officerRouter from "./routes/officerRouter.js";
import evidenceRouter from "./routes/evidenceRouter.js";
import caseRouter from "./routes/caseRouter.js";
import recordRouter from "./routes/recordRouter.js";

// ES module URL support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();

// Load environment variables
config({ path: "./config/config.env" });

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
}));

// Compression
app.use(compression());

// Rate limiting
app.use(globalLimiter);
app.use("/api/v1/auth", authLimiter);

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  maxAge: 86400
}));

// Regular Middlewares
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection test
// db.getConnection()
//   .then(connection => {
//     logger.info("Successfully connected to MySQL database");
//     connection.release();
//   })
//   .catch(err => {
//     logger.error("Database connection error:", err);
//   });

// API Routes with version prefix
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/victims", victimRouter);
app.use("/api/v1/suspects", suspectRouter);
app.use("/api/v1/witnesses", witnessRouter);
app.use("/api/v1/officers", officerRouter);
app.use("/api/v1/evidence", evidenceRouter);
app.use("/api/v1/cases", caseRouter);
app.use("/api/v1/records", recordRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: {
      status: db.pool ? 'Connected' : 'Disconnected'
    },
    environment: process.env.NODE_ENV
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Trust first proxy
  app.set('trust proxy', 1);
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Error Middleware
app.use(errorMiddleware);

// 404 Handler - Keep this after all routes
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handlers
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  console.log('Shutting down the server due to Unhandled Promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  console.log('Shutting down the server due to Uncaught Exception');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  db.end(() => {
    logger.info('Database connection closed');
    process.exit(0);
  });
});

export { logger };
export default app;