const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');

/****************************************************************************************
 * @description: Delete an existing document
 */
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError(404, 'No document found with that id'));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

/****************************************************************************************
 * @description: Update an existing document
 */
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(404, 'No document found with that id'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

/****************************************************************************************
 * @description: Create a new document
 */
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: newDoc,
      },
    });
  });

/****************************************************************************************
 * @description: Get a specific document's information by ID
 */
exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    // @NOTE: return null is not an error in Mongoose
    // Can use .orFail() to save an extra if. but maybe not needed here
    if (!doc) {
      return next(new AppError(404, 'No document found with that id'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

/****************************************************************************************
 * @description: Get all documents' information
 */
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET in reviews controller
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        data: docs,
      },
    });
  });
