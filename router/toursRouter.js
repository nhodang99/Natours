const express = require('express');
const controller = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.param('id', controller.checkId);

router
  .route('/top-5-cheap')
  .get(controller.aliasTopTour, controller.getAllTours);

router.route('/tour-stats').get(controller.getTourStats);
router.route('/monthly-plan/:year').get(controller.getMonthlyPlan);

router
  .route('/')
  .get(authController.protect, controller.getAllTours)
  .post(controller.verifyDiscount, controller.createTour);

router
  .route('/:id')
  .get(controller.getTour)
  .patch(controller.verifyDiscount, controller.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), // execute immediately to return a middleware,
    controller.deleteTour
  );

module.exports = router;
