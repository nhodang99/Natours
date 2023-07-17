module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next); // equal to .catch(err=> next(err))
};
