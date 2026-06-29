import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import mongoose from 'mongoose'; // <-- Added Mongoose core import
import { clerkMiddleware } from '@clerk/express';
import githubRouter from './routes/github.js';
import aiRouter from './routes/ai.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

console.log('--- Database Diagnostic Check ---');
console.log('Detected MONGO_URI String:', MONGO_URI ? 'Cloud Atlas String Found ✅' : 'UNDEFINED - Falling back to local ❌');
console.log('---------------------------------');

console.log('🔄 Connecting to MongoDB Cluster...');

// 1. Establish database connection pool before opening the server port
console.log('🔄 Connecting to MongoDB Cluster...');
mongoose.connect(MONGO_URI|| 'mongodb://127.0.0.1:27017/devpulse')
  .then(() => {
    console.log('✅ MongoDB connection established successfully.');
  })
  .catch((err) => {
    console.error('❌ Critical Database Connection Failure:', err.message);
  });

// 2. Global Request Configuration Lifecycle Middleware
app.use(cors({ 
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); 

app.use(express.json());

// 3. Authenticate all incoming requests globally using Clerk
app.use(clerkMiddleware());

// 4. Mount downstream data pipeline endpoints
app.use('/api/github', githubRouter);
app.use('/api/ai', aiRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('DevPulse Backend Server Running');
});

app.listen(PORT, () => {
  console.log(`🚀 Server navigating smoothly on port ${PORT}`);
});