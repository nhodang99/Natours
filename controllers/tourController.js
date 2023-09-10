//const validator = require('validator');
const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

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
/****************************************************************************************
 * @description: Get all tours' information
 */
exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new ApiFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const tours = await features.query;

  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
});

/****************************************************************************************
 * @description: Get a specific tour's information by ID
 */
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // @NOTE: return null is not an error in Mongoose
  // Can use .orFail() to save an extra if. but maybe not needed here
  if (!tour) {
    return next(new AppError(404, 'No tour found with that id'));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

/****************************************************************************************
 * @description: Create a new tour
 */
exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

/****************************************************************************************
 * @description: Update an existing tour
 */
exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) {
    return next(new AppError(404, 'No tour found with that id'));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

/****************************************************************************************
 * @description: Delete a specific tour by ID
 */
exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);
  if (!tour) {
    return next(new AppError(404, 'No tour found with that id'));
  }

  res.status(204).json({
    status: 'success',
    data: null,
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
