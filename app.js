
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');
var createLogger = require('jsx').createLogger;
var config = require('./config');

var app = express();

app.configure(function(){
  if (config.behindProxy) app.enable('trust proxy');
  app.set('config', config);
  app.set('logger', createLogger);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  //app.set('view engine', 'html');
  //app.enable('view cache');
  app.engine('ejs', require('ejs-locals'));
  app.engine('html', require('hogan-express'));
  
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  //attach middleware to detect request for various response format (such as html, json), and put it in request.format
  app.use(require('modex').formatResolver());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var mongoose = require('mongoose');
mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo DB connection error:'));
db.once('open', function callback () {
  //require('modex')(app, {routeManagers: [config.adminModule, config.homeModule], moduleSettings: config.modules});
  //console.log(process.memoryUsage());
  require('modex')(app, {moduleSettings: config.modules});
  //console.log(process.memoryUsage());
 
  app.listen(config.port, function(){
    console.log("Express server listening on port " + config.port);
  });
});


process.on('exit', function() {
  console.log('About to exit 1.');
});
process.on('SIGTERM', process.exit);
process.on('SIGINT', process.exit);
