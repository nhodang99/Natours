const fs = require('fs');

const dbFilePath = `${__dirname}/../dev-data/data/tours-simple.json`;
const tours = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));

// MIDDLEWARE
exports.checkId = (req, res, next, val) => {
   const id = Number(val);
   const tour = tours.find((el) => el.id === id);

   if (!tour) {
      return res.status(404).json({
         status: 'error',
         message: 'Tour does not exist',
      });
   }
   //req.tour = tour;
   res.locals.tour = tour;
   next();
};

exports.checkBody = (req, res, next) => {
   if (!req.body.name || !req.body.price) {
      return res.status(400).json({
         status: 'error',
         message: 'Data invalid',
      });
   }
   next();
};

// API
exports.getAllTours = (req, res) => {
   res.status(200).json({
      status: 'success',
      data: {
         tours,
      },
   });
};

exports.getTour = (req, res) => {
   res.status(200).json({
      status: 'success',
      data: {
         //tour: req.tour,
         tour: res.locals.tour,
      },
   });
};

exports.createTour = (req, res) => {
   const newId = tours[tours.length - 1].id + 1;
   const newTour = { ...{ id: newId }, ...req.body };

   tours.push(newTour);

   fs.writeFile(dbFilePath, JSON.stringify(tours), (err) => {
      if (err) {
         return res.status(14).json({
            status: 'error',
            message: 'Write to file fails',
         });
      }

      res.status(201).json({
         status: 'success',
         data: {
            tour: newTour,
         },
      });
   });
};

exports.updateTour = (req, res) => {
   res.status(200).json({
      status: 'success',
      data: {
         tour: '<Updated tour here...>',
      },
   });
};

exports.deleteTour = (req, res) => {
   res.status(204).json({
      status: 'success',
      data: null,
   });
};
