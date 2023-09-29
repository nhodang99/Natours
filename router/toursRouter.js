const express = require('express');
const controller = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewsRouter');

const router = express.Router();

// Nested route
//POST /tour/142523545/reviews
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(controller.aliasTopTour, controller.getAllTours);

router.route('/tour-stats').get(controller.getTourStats);
router.route('/monthly-plan/:year').get(
  authController.protect,
  authController.restrictTo('admin', 'lead-guide', 'guide'), // execute immediately to return a middleware
  controller.getMonthlyPlan
);

// geospatial
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(controller.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(controller.getDistances);

router
  .route('/')
  .get(controller.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    controller.verifyDiscount,
    controller.createTour
  );

router
  .route('/:id')
  .get(controller.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    controller.verifyDiscount,
    controller.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    controller.deleteTour
  );

module.exports = router;
