require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db'); 

// Import Rate Limiter Middleware
const { globalLimiter } = require('./middleware/rateLimiter');

// Load Passport Strategy
require('./config/passport'); 

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const couponRoutes = require('./routes/couponRoutes');

const app = express();

// Connect to MongoDB
connectDB();

// Handle reverse proxy headers (Render, Vercel, Nginx) for accurate IP rate limiting
app.set('trust proxy', 1);

// CORS Configuration
const corsOptions = {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Apply Global Rate Limiting to all /api routes
app.use('/api', globalLimiter);

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/coupons', couponRoutes);

app.get('/test', (req, res) => {
    res.status(200).json({ message: "Habesha Cloths API is running perfectly! 🚀" });
});

// Error Handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});