var BasicCrud = require('modex').controllers.BasicCrud;
var c = module.exports = new BasicCrud({
  model: require('../models/experiment'),
  defaultFormats:'json',
  actions: 'ui list show create update'
});

c.ui = function(req, res) {
  res.respond({_view:'ui', _layout:'layout', title:'Experiment Manager'});
};
c.ui_route = '.ui';
c.ui_format = 'html';

c.list_filter = function(req) {
  return {owner: req.session.user.id};
};
