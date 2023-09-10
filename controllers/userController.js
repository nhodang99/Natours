const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

const filterObj = (obj, ...allowedFields) => {
  const retObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      retObj[el] = obj[el];
    }
  });
  return retObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create an error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError(400, 'This route is not for password update'));
  }

  // 2) Update the document
  const filteredBody = filterObj(req.body, 'name', 'password');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/**
 *
 * @param {object} req
 * @param {object} res
 */
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route (getuser) is not yet defined!',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!',
  });
};
