//const validator = require('validator');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Middleware
exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

/****************************************************************************************
 * @description: verify if the price discount is lower than price
 * @todo: remove it
 */
exports.verifyDiscount = catchAsync(async (req, res, next) => {
  const { priceDiscount, price } = req.body;

  if (priceDiscount) {
    let regularPrice = price;
    if (!regularPrice) {
      if (req.method === 'POST') {
        // Create a tour without price, let the mongoose handle error
        next();
      } else if (req.method === 'PATCH') {
        // No new price in request body, use current price of tour
        const tourToUpdate = await Tour.findById(req.params.id);
        regularPrice = tourToUpdate.price;
      }
    }

    if (priceDiscount > regularPrice) {
      return next(
        new AppError(
          400,
          `Discount price (${priceDiscount}) should be below regular price (${regularPrice})`
        )
      );
    }
  }
  next();
});

// API
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // of the globe

  if (!lat || !lng) {
    next(
      new AppError(
        400,
        'Please provide latitude and longtitude in the forat lat,lng'
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        400,
        'Please provide latitude and longtitude in the forat lat,lng'
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

// Aggregation pipeline
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgRating: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

// Unwinding and projecting
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const { year } = req.params;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lt: new Date(`${year + 1}-01-01`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStart: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $set: { month: '$_id' }, // or $addFields
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: {
        numTourStart: -1, // Descending order
      },
    },
    // {
    //   $limit: 12,
    // },
  ]);

  res.status(200).json({
    status: 'success',
    plan,
  });
});
