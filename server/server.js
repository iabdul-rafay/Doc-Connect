/**
 * server.js — Doc-Connect API entry point.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Render (and most PaaS hosts) sit the app behind a reverse proxy that sets
// X-Forwarded-For. Without telling Express to trust it, express-rate-limit
// throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR on every request, which crashes
// the response before CORS headers are sent — the browser then misleadingly
// reports this as a CORS error instead of the real cause.
app.set('trust proxy', 1);

connectDB();

// CLIENT_URL can be a single origin or a comma-separated list (handy while
// debugging, or if you have both a production and a preview Vercel URL).
// Trailing slashes are stripped automatically so "https://x.vercel.app/" and
// "https://x.vercel.app" both match.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

console.log('✅ CORS allowed origins:', allowedOrigins);

app.use(
  cors({
    origin(origin, callback) {
      // Allow no-origin requests (curl, server-to-server, Postman, health checks).
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }

      console.warn(`⚠  CORS blocked request from origin "${origin}". Allowed: ${allowedOrigins.join(', ')}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Serve uploaded avatars.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check.
app.get('/', (_req, res) =>
  res.json({ success: true, service: 'Doc-Connect API', status: 'running' })
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🩺 Doc-Connect API ready on http://localhost:${PORT}`);
  console.log(`   Client origin(s): ${allowedOrigins.join(', ')}\n`);
});