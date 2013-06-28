var BasicCrud = require('modex').controllers.BasicCrud;
module.exports = function init(mod) {
  return new BasicCrud({model: mod.model('experiment')});
};