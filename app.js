const path = require('path');
const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrHandler = require('./controllers/errorController');
const toursRouter = require('./router/toursRouter');
const usersRouter = require('./router/usersRouter');
const viewsRouter = require('./router/viewsRoutes');

// 1) MIDDLEWARE
const app = express();
app.use(express.json());

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));

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
