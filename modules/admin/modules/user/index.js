
module.exports = exports = function(mod) {
  mod.meta('route', 'um');
  mod.meta('label', 'User Manager');
  //mod.addControllers('./controllers');
  //mod.addModels('./models');
  //mod.addView('path');
  //mod.addView('path','name');
  //mod.addViews(./views);
  //mod.addController('./controllers/users',{interface:'backend'});
  mod.authenticate = function(username, password, cb) {
    mod.model('user').authenticate(username, password, cb);
  };
  
  mod.init(function(manager){
    var dummyUser = mod.meta('dummySessionUser');
    //absolute
    if (dummyUser) mod.mount('all', '*', {route:'/'}, function (req, res, next){
      if (req.session.user) next();
      else mod.model('user').authenticate(dummyUser.username, dummyUser.password, function(user){
        res.locals._user = req.session.user = user;
        //console.log('user found');
        next();
      });
    }); 
    mod.mount('get', '/manual', dummyController); //relative
    mod.mount('get', '', 'index', index); //relative
  });
};

function index(req, res, next) {
  res.send('index');
}

function dummyController(req, res, next) {
  res.send('dummy');
  //res.render('test',{});
}

//exports.models.user = require('./models/user');
//exports.route = 'usermanager';


