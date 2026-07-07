import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import worldClockRoutes from './routes/worldClockRoutes.js';
import { initializeClock } from './services/worldClockService.js';
import { tickEngine, registerDefaultModules } from './services/economicEngine.js';

// ES Modules __dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config settings
dotenv.config({ path: path.join(__dirname, '.env') });

// Establish DB connection
connectDB().then(() => {
  initializeClock();
  registerDefaultModules();
});

const app = express();

// Global request filters
app.use(cors());
app.use(express.json());

// Economic Engine Tick Interceptor
app.use('/api', async (req, res, next) => {
  try {
    await tickEngine();
  } catch (err) {
    console.error(`[Economic Engine Middleware Error] ${err.message}`);
  }
  next();
});

// Routing linkages
app.use('/api/auth', authRoutes);
app.use('/api/startup', startupRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/world-clock', worldClockRoutes);

// Static assets production routing - conditionally enabled if built frontend files are present
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Graceful fallback for decoupled deployment (e.g. Render backend host)
  app.get('/', (req, res) => {
    res.json({
      message: '[CapitalGrid API] Server running successfully.',
      environment: process.env.NODE_ENV || 'production',
      endpoints: ['/api/auth', '/api/startup', '/api/production']
    });
  });
}

// App listener activation
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[CapitalGrid Server] Server activated on port ${PORT}`);
});
