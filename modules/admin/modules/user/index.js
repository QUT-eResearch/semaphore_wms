
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
    manager.mount('get', '/usertest', dummyController); //absolute
    mod.mount('get', '/manual', dummyController); //relative
    mod.mount('get', '', 'index', index); //relative
  });
  
  mod.installer(function() {
    console.log('installer');
    mod.model('user').findOne({isSuperuser:true}, function(err, docs) {
      console.log('test');
      console.log(docs);
      if (docs) {
        console.log('A superuser exists. Not adding a new superuser');
        db.close();
      } else {
        mod.model('user').create(
          {
            username:'admin', 
            fullname:'Administrator', 
            password:'admin', 
            isSuperuser:'true'
          }, 
          function(err) {
            if (!err) console.log('Success creating a superuser.');
            else console.log(err);
          }
        );
      }
    });
  });
  
  mod.uninstaller(function() {
    mod.model('user').collection.drop();
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


