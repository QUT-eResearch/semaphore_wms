var StaticPages = require('modex').controllers.StaticPages;
/**
 * Module that provides the frontend app and handles the root route of the web app.
 */
module.exports = function(mod) {
  mod.meta('route', '');
  mod.addStatic('static');
  mod.addController(new StaticPages(mod, 'pages'));
  mod.init(function(mod, manager, app){
    mod.mount('get', '/', 'index', index);
    app.locals._user = null;
    app.locals.title = '';
  });
};

function index(req, res, next) {
  res.respond({_view:'index', _layout:'layout', title:'Home'});
}

/*
function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.locals.messageCode = 'login';
    res.locals._redirect = req.originalUrl;
    res.locals._username = '';
    loginForm(req, res, next);
  } else {
    res.locals._username = req.session.username;
    next();
  }
}

function loginForm(req, res, next) {
  if (!res.locals.messageCode) res.locals.messageCode = '';
  if (!res.locals._redirect) res.locals._redirect = fullRoute;
  res.renderHtmlView('login', {_layout:'layout', title:'Login', _username:''});
}

function login(req, res, next) {
  var user = req.body.user;
  var password = req.body.password;
  var redirectPath = req.body._redirect || fullRoute;
  if (user && password) {
    var userModel = modUser.model('user');
    //user.authenticate
    req.session.user_id = 1;
    req.session.username = "asdf";
    res.redirect(redirectPath);
    //res.renderHtmlView('login',{_layout:'layout', title:'Login'});
  } else {
    res.renderHtmlView('login',{_layout:'layout', title:'Login', messageCode:'empty', _redirect: redirectPath});
  }
}

function logout(req, res) {
  delete req.session.user_id;
  res.redirect(fullRoute + '/login');
}
*/