const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/config.env` });

const mongoose = require('mongoose');
const app = require('./app');

const DB = process.env.DB.replace('<PASSWORD>', process.env.DB_PASSWORD);

mongoose
   .connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
   })
   .then(() => console.log('DB connection successfully'));

const tourSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
   },
   rating: {
      type: Number,
      default: 4.5,
   },
   price: {
      type: Number,
      required: [true, 'A tour must have a price'],
   },
});

const Tour = mongoose.model('Tour', tourSchema);

const testTour = new Tour({
   name: 'The Park Camper',
   price: 997,
});

testTour
   .save()
   .then((doc) => {
      console.log(doc);
   })
   .catch((err) => {
      console.log('ERROR: ', err);
   });

// START SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
   console.log(`App running on port ${port}...`);
});
