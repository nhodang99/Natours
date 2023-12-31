const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

/**
 * Sign a JWT token to a specific user id
 * @param id
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRED_TIME,
  });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;

  res.cookie('jwt', token, cookieOption);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

/**
 * Signup account
 */
exports.signup = catchAsync(async (req, res, next) => {
  // Specify only fields we need to avoid risk in request body
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt, // for now only
  });

  createAndSendToken(newUser, 201, res);
});

/**
 * Login account
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError(400, 'Please provide email and password'));
  }

  // Check if user exist and password correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.isPasswordCorrect(password, user.password))) {
    return next(new AppError(401, 'Incorrect email or password'));
  }

  // If everything ok, send token to client
  createAndSendToken(user, 200, res);
});

/**
 * Authorize request permission before proceeding a private action
 * @description: Verify JWT token in the incoming request
 */
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token
  let token = '';
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer')) {
    token = auth.split(' ')[1];
  }

  if (!token) {
    return next(new AppError(401, 'Please login to have access'));
  }

  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(401, 'The user belonging to this token no longer exists')
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError(401, 'Password recently changed. Please login again!')
    );
  }

  req.user = currentUser;
  next();
});

/**
 * @param  {...array} roles
 * @returns 403 error if account is not a special role
 */
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles ['admin', 'lead-guide'], role=user
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action')
      );
    }
    next();
  };

/**
 * @summary: send email with token to user to reset the password
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(404, 'Email invalid'));
  }

  // 2) Generate random reset token
  const resetToken = user.createPwdResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message =
    `Forgot your password? Submit a patch request with you new password and passwordConfirm to: ${resetUrl}.\n` +
    `If you didn't send this request, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email, // same with req.body.email
      subject: 'Password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to user email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpired = undefined;
    await user.save({ validateBeforeSave: false }); // Lack of email, pass,...so do not validate

    return next(
      new AppError(
        500,
        'There was an error sending email. Please try again later.'
      )
    );
  }
});

/**
 * @description: Reset password
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpired: { $gt: Date.now() },
  });

  // 2) If token has not expired, set the new password
  if (!user) {
    return next(new AppError(400, 'Token invalid or expired'));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpired = undefined;
  await user.save(); // We need to valdiate

  // 3) Update changePasswordAt property
  // Done in the pre-save hook

  // 4) Log the user in, send JWT
  createAndSendToken(user, 200, res);
});

/****************************************************************************************
 * @description: update
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get User from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed password is correct by compare
  // the currentPassword with the one stored in model
  if (
    !user ||
    !(await user.isPasswordCorrect(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError(401, 'Your provided information is wrong'));
  }

  // 3) Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  createAndSendToken(user, 200, res);
});
