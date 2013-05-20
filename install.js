var config = require('./config');
var User = require('./modules/admin/modules/user/models/user');
var mongoose = require('mongoose');
mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo DB connection error:'));
db.once('open', function callback () {

  User.findOne({isSuperuser:true}, function(err, docs) {
    if (docs) {
      console.log('A superuser exists. Not adding a new superuser');
      db.close();
    } else {
      User.create(
        {
          username:'admin', 
          fullname:'Administrator', 
          password:'admin', 
          isSuperuser:'true'
        }, 
        function(err) {
          if (!err) console.log('Success creating a superuser.');
          else console.log(err);
          db.close();
        }
      );
    }
  });
  
});