
module.exports = function(mod) {
  mod.meta('route', '/experiments');
  mod.meta('label', 'Experiment Manager');
  //mod.addControllers('./controllers');
  //mod.addModels('./models');
  //mod.addView('path');
  //mod.addView('path','name');
  //mod.addViews(./views);
  //mod.addController('./controllers/experiments',{interface:'frontend'});
  mod.init(init);
};

function init(mod, manager) {
  console.log(mod.controllers);
  mod.mountController(mod.controller());
  var backendName = mod.meta('route');
  mod.mountController(mod.controller('backend'), {name:backendName, interface:'backend'});
  mod.mountControllers(false);
}