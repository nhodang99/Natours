const path = require('path');
const express = require('express');
const morgan = require('morgan');
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

// Serving statiac file
app.use(express.static(path.join(__dirname, '/public')));

app.use((req, res, next) => {
   req.requestTime = new Date().toISOString();
   next();
});

// 3) ROUTING
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/', viewsRouter);

module.exports = app;
