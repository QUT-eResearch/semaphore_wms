"use strict";
var jsx = require('jsx');
var instances = {};

exports = module.exports = function(mod) {
  mod.meta('route', 'auth');
  mod.addView('login.ejs');
  mod.init(initialize);
};

function initialize(mod, manager) {
  var authRoute = mod.meta('route');
  var loginRoute = authRoute + mod.meta('login');
  var logoutRoute = authRoute + mod.meta('logout');
  
  var Auth = function(baseModule, authenticateCb, authorizeCb) {
    //console.log(loginRoute);
    mod.mount('post', loginRoute, {actionName:'login', module:baseModule}, [manager.parseBody, login.bind(this)]);
    mod.mount('get', loginRoute, {actionName:'loginForm', module:baseModule}, loginForm.bind(this)); ////!important `login` must be defined before `*`
    mod.mount('get', logoutRoute, {actionName:'logout', module:baseModule}, logout.bind(this));
    this.baseModule = baseModule;
    this.authenticate = authenticateCb;
    this.authorize = authorizeCb;
    this.loginOptions = {
      _layout:'layout',
      title:'Login'
    };
  };
  Auth.prototype.protectRoute = function(method, route) {
    mod.mount(method, route, {module:this.baseModule}, checkAuth.bind(this));
  };
  Auth.prototype.protectEntity = function(entityIdentifier) {
    //this.baseModule.injectHandlers('pre', entityIdentifier, checkAuth.bind(this));
    var re = createPatternRegex(entityIdentifier);
    var self = this;
    self.baseModule.beforeMount(function(method, route, entity) {
      //console.log('!!!!!!!!!!!!!!!!!!!!!!!!');
      //console.log(entity);
      if (entity.owner !== mod && re.test(entity.toString())) mod.mount(method, route, {module:self.baseModule}, checkAuth.bind(self));
    });
  };
  
  var secure = mod.meta('secure');
  secure.forEach(function(item) {
    var baseModule = manager.module(item.module);
    var authenticateStr = item.authenticate || mod.meta('authenticate');
    //console.log('authenticateStr: %s', authenticateStr);
    var fnAuthenticate = manager.method(authenticateStr) || manager.method(mod.namespace+'.'+authenticateStr) || authenticateAll;
    var authorizeStr = item.authorize || secure.authorize;
    var fnAuthorize = manager.method(authorizeStr) || manager.method(mod.namespace+'.'+authorizeStr) || authorizeAll;
    var instance = instances[baseModule.namespace] = new Auth(baseModule, fnAuthenticate, fnAuthorize);
    if (Array.isArray(item.routes)) {
      item.routes.forEach(function(r){
        var tokens = r.split(/\s+/);
        if (tokens.length === 1) {
          instance.protectEntity(r);
        } else if (tokens.length === 2) {
          instance.protectRoute(tokens[0], tokens[1]);
        }
      });
    }
  });

}

function createPatternRegex(word){
  var suffix = '$';
  if (jsx.string.endsWith(word, '.*')) {
    pattern = word.slice(0, -2);
    suffix = '($|\\.\\w+)';
  }
  var pattern = pattern.replace(/\*/g, '\\w*');
  pattern = pattern.replace(/\./g, '\\.');
  pattern = '(^|\\w*\\.)' + pattern + suffix;
  return new RegExp(pattern);
}


function checkAuth(req, res, next) {
  //console.log('check auth');
  var user = req.session.user;
  var loginOptions = this.loginOptions;
  if (user) {
    this.authorize( user, 
      function allow(){
        next();
      },
      function deny() {
        loginOptions._view = 'unauthorized';
        res.respond(loginOptions);
      }
    );
  } else {
    res.locals.code = 'login';
    res.locals.redirect = req.originalUrl;
    loginOptions._view = 'login';
    res.respond(loginOptions);
  }
}

function loginForm(req, res) {
  res.locals.code = '';
  res.locals.redirect = '/';
  this.loginOptions._view = 'login';
  res.respond(this.loginOptions);
}

function login(req, res) {
  var username = req.body.user;
  var password = req.body.password;
  var redirectPath = req.body._redirect || this.baseModule.routePath;
  var loginOptions = this.loginOptions;
  res.locals.redirect = redirectPath;
  if (username && password) {
    this.authenticate(username, password, function(user) {
      if (user) {
        req.session.user = user;
        res.redirect(redirectPath);
      } else {
        res.locals.code = 'denied';
        loginOptions._view = 'login';
        res.respond(loginOptions);
      }
    });
  } else {
    res.locals.code = 'empty';
    loginOptions._view = 'login';
    res.respond(loginOptions);
  }
}

function logout(req, res) {
  delete req.session.user;
  res.redirect(res.locals._.url.action('loginForm'));
}

function authenticateAll(username, password, callback) {
  callback({username:username, fullname:'Anonymous'});
}

function authorizeAll(user, allowCallback) {
  allowCallback();
}