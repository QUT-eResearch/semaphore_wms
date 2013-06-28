var StaticPages = require('modex').controllers.StaticPages;
/**
 * Module that provides the frontend app and handles the root route of the web app.
 */
module.exports = function(mod) {
  mod.meta('route', '/');
  mod.addStatic('static');
  mod.addController(new StaticPages(mod, 'pages'));
  mod.init(function(mod, manager, app){
    mod.mount('get', '', 'index', index);
    app.locals.title = '';
  });
};

function index(req, res, next) {
  res.respond({_view:'index', _layout:'layout', title:'Home'});
}