var modman = require('./modman');

var controller = require('modex').createController();

module.exports = function(mod) {
  mod.meta('route', 'system');
  mod.meta('label', 'System');
  controller.index_title = mod.meta('label');
  
  mod.addView('index.ejs');
  mod.addDefaultController(controller);
  mod.addController(modman.controller, {name:'modules'});
};
