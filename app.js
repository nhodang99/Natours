const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrHandler = require('./controllers/errorController');
const toursRouter = require('./router/toursRouter');
const usersRouter = require('./router/usersRouter');
const viewsRouter = require('./router/viewsRoutes');

// 1) MIDDLEWARE
const app = express();

// Security HTTP header
app.use(helmet());

// Request info
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit request from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in 1 hours',
});
app.use('/api', limiter);

// Rendering engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));

// Body parser, reading data from body in to req.body
app.use(express.json({ limit: '10kb' }));

// Data santinization against NoSQL query injection
app.use(mongoSanitize());

// Data santinization against XSS attack
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Serving static file
app.use(express.static(path.join(__dirname, '/public')));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

// 3) ROUTING
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/', viewsRouter);

// Handle unwanted routes
app.use('*', (req, res, next) => {
  next(new AppError(404, `Url ${req.originalUrl} not found`));
});

app.use(globalErrHandler);

module.exports = app;
