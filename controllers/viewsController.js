exports.getOverview = (req, res) => {
   // 1) get tour data from collection
   // 2) build template
   // 3) Render template
   res.status(200).render('overview', {
      title: 'All tours',
   });
};

exports.getTour = (req, res) => {
   res.status(200).render('tour', {
      title: 'The Forest Hiker tour',
   });
};
