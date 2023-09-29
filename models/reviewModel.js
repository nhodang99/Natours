const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belogn to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Set this option to true to exclude query fields that not in schema from process DB request
// E.g: limit, page, sort, fields
reviewSchema.set('strictQuery', true);

// One user can only give 1 review each tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// populating referencing data to the response
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAvgRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: 'rating' },
      },
    },
  ]);
  console.log(stats);
  if (stats.length > 0) {
    Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, // default value
    });
  }
};

reviewSchema.post('save', async function () {
  // this point to current review
  // this.constructor equivalent to Review, whilst Review is not declared
  await this.constructor.calcAvgRatings(this.tour);
});

// Update review, we need to get this.docToBeUpdated because post-hook cannot access the document
// And we need post-hook to calculate averate rating
// findByIdAndUpdate, findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.docToBeUpdated = await this.findOne();
  console.log(this.docToBeUpdated);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.docToBeUpdated.constructor.calcAvgRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
