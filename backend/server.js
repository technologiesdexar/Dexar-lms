const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const authRoutes = require('./routes/auth');
const superadminRoutes = require('./routes/superadmin');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const contactRoutes = require('./routes/contact');

const User = require('./models/User');
const Subject = require('./models/Subject');
const LiveClass = require('./models/LiveClass');
const RecordedClass = require('./models/RecordedClass');
const Assessment = require('./models/Assessment');
const CodingExam = require('./models/CodingExam');
const Payment = require('./models/Payment');
const Doubt = require('./models/Doubt');
const CourseMaterial = require('./models/CourseMaterial');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: false, // Ensure Razorpay and external frontend assets are permitted
    crossOriginEmbedderPolicy: false,
  })
);

// High-speed HTTP Gzip/Brotli payload compression (reduces payload by 70-80% for 500+ students)
app.use(compression());

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '10mb' }));

// In-Memory High-Speed Cache for Read-Heavy Queries (protects MongoDB Atlas M0 512MB RAM)
const apiCache = new Map();
const CACHE_TTL_MS = 20 * 1000; // 20-second TTL cache

// Automatic cache invalidation whenever any creation, update, or deletion occurs
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    apiCache.clear();
  }
  next();
});

// Cache middleware for fast, sub-millisecond responses
app.use((req, res, next) => {
  // Only cache safe GET requests to catalog/listing endpoints
  const isCacheable =
    req.method === 'GET' &&
    (req.path.includes('/recorded-classes') ||
      req.path.includes('/live-classes') ||
      req.path.includes('/subjects') ||
      req.path.includes('/dashboard'));

  if (!isCacheable) return next();

  const authHeader = req.headers.authorization || '';
  const cacheKey = `${authHeader.slice(-10)}:${req.originalUrl || req.url}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    res.setHeader('X-Dexar-Cache', 'HIT');
    return res.json(cached.data);
  }

  const originalJson = res.json.bind(res);
  res.json = (data) => {
    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    res.setHeader('X-Dexar-Cache', 'MISS');
    return originalJson(data);
  };
  next();
});

// Tuned rate limiter for 500+ students sharing institutional or campus NAT IPs
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Generous limit permitting concurrent students on shared IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'High authentication traffic detected. Please retry in a few moments.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

let mongoError = null;

// Root & Healthcheck Routes for Render and monitoring
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Dexar LMS API Server',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/disconnected',
    dbError: mongoError,
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Dexar LMS API Server is running smoothly!',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting/disconnected',
    dbError: mongoError,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/contact', contactRoutes);

// Auto-seed Initial SuperAdmin only (No demo subjects, students, trainers, or classes)
const seedInitialData = async () => {
  try {
    // 1. Ensure SuperAdmin exists
    let superAdmin = await User.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);
      superAdmin = new User({
        name: 'Super Administrator',
        email: 'superadmin@dexar.com',
        password: hashedPassword,
        isPasswordSet: true,
        role: 'superadmin',
      });
      await superAdmin.save();
      console.log('✅ SuperAdmin verified: superadmin@dexar.com / SuperAdmin@123');
    } else {
      console.log(`✅ SuperAdmin account active: ${superAdmin.email}`);
    }

    // Ensure all existing users with a password have isPasswordSet: true
    await User.updateMany(
      { password: { $exists: true, $ne: '' }, isPasswordSet: { $exists: false } },
      { $set: { isPasswordSet: true } }
    );

    // Sanitize any coding exams in MongoDB so that they never leak answers in starterCode
    const cleanStub = 'function solution(input) {\n  // Write your logic here\n  \n}';
    const codingExams = await CodingExam.find({});
    for (const ce of codingExams) {
      let modified = false;
      if (ce.starterCode && (ce.starterCode.includes('.reverse().join') || ce.starterCode.includes('return input.split') || ce.starterCode.includes('return input;'))) {
        ce.starterCode = cleanStub;
        modified = true;
      }
      if (ce.questions && Array.isArray(ce.questions)) {
        ce.questions.forEach((q) => {
          if (q.starterCode && (q.starterCode.includes('.reverse().join') || q.starterCode.includes('return input.split') || q.starterCode.includes('return input;'))) {
            q.starterCode = cleanStub;
            modified = true;
          }
        });
      }
      if (modified) {
        ce.markModified('questions');
        ce.markModified('starterCode');
        await ce.save();
        console.log('✅ Sanitized CodingExam starterCode:', ce.title);
      }
    }
  } catch (err) {
    console.error('Error verifying SuperAdmin / initial data:', err);
  }
};

// Secure MongoDB URI configuration: read strictly from environment
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

// Start listening immediately on 0.0.0.0 so Render detects port binding without waiting/timing out
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=======================================================`);
  console.log(`🚀 Dexar LMS Backend API Server running on port ${PORT}`);
  console.log(`🔗 Local Address: http://localhost:${PORT}/api`);
  console.log(`🌐 Bound to 0.0.0.0:${PORT} (Render Web Service Ready)`);
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/health`);
  console.log(`=======================================================\n`);

  // Render Free Tier Keep-Alive to prevent cold start spin-down
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;
  if (renderExternalUrl) {
    const PING_INTERVAL = 13 * 60 * 1000; // Ping every 13 minutes (Render sleeps at 15m)
    setInterval(async () => {
      try {
        const pingTarget = `${renderExternalUrl.replace(/\/$/, '')}/health`;
        const res = await fetch(pingTarget);
        if (res.ok) {
          console.log(`[Dexar KeepAlive] Render dyno pinged successfully at ${new Date().toISOString()}`);
        }
      } catch (err) {
        // Silently ignore ping errors
      }
    }, PING_INTERVAL);
    console.log(`[Dexar KeepAlive] Active auto-pinger for ${renderExternalUrl} (every 13m)`);
  }
});

// Connect to MongoDB with high-concurrency connection pooling tuned for Atlas M0 (Free Tier)
// MongoDB Atlas M0 max connection limit is 500. We bound our pool to 50 active sockets
// which can effortlessly handle 1000+ operations/sec while leaving 90% connection headroom!
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI, {
      maxPoolSize: 50, // Caps active sockets to 50 (shared across all 500+ concurrent students)
      minPoolSize: 5,  // Keeps 5 warm connections immediately ready
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      maxIdleTimeMS: 30000, // Reclaims idle connections after 30s
    })
    .then(async () => {
      const maskedUri = MONGODB_URI.replace(/\/\/.*@/, '//***@');
      console.log('[Dexar Backend] MongoDB Connected Successfully:', maskedUri);
      await seedInitialData();
    })
    .catch((err) => {
      mongoError = err.message;
      console.warn('\n⚠️  [Dexar Backend] MongoDB Connection Notice:', err.message);
      console.warn('👉 Ensure MONGODB_URI environment variable is configured in backend/.env or Render dashboard.\n');
    });
} else {
  console.warn('⚠️  [Dexar Backend] MONGODB_URI is not defined in environment variables. Database operations will be unavailable until configured.');
}

