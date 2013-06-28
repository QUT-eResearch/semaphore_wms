
module.exports = function(mod) {
  mod.meta('route', 'experiments');
  mod.meta('label', 'Experiment Manager');
  mod.addStatic('static');
  //mod.addControllers('./controllers');
  //mod.addModels('./models');
  //mod.addView('path');
  //mod.addView('path','name');
  //mod.addViews(./views);
  //mod.addController('./controllers/experiments',{interface:'frontend'});
  mod.init(init);
};

function init(mod, manager) {
  //console.log('experiment init');
  //console.log(mod.controllers);
  mod.mountController(mod.controller(), {interface:'frontend'});
  mod.mountController(mod.controller('bWorkflows'), {name:'workflows', interface:'backend'});
  mod.mountController(mod.controller('bExperiments'), {name:'experiments', interface:'backend'});
  mod.mountControllers(false);
}