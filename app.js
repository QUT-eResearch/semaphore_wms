
/**
 * Module dependencies.
 */

var express = require('express');
var path = require('path');
var createLogger = require('jsx').createLogger;
var modex = require('modex');
var config = require('./config');

var app = express();
var logLevel = 'debug';

app.configure(function(){
  if (config.behindProxy) app.enable('trust proxy');
  app.set('config', config);
  app.set('logger', createLogger);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  //app.set('view engine', 'html');
  app.engine('ejs', require('ejs-locals'));
  app.engine('html', require('hogan-express'));
  
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('semaphore_wms:aZ1sFokuX9bi65d38'));
  app.use(express.session());
  //attach middleware to detect request for various response format (such as html, json), and put it in request.format
  app.use(modex.formatResolver());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.logger('dev'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  logLevel = 'debug';
});
  //app.enable('view cache');
app.configure('production', function(){
  //app.use(express.logger('tiny'));
  app.use(express.errorHandler());
  logLevel = 'info';
});

// The default log levels: debug|0, info|1, warn|2, error|3, fatal|4
createLogger.level = process.env.SEMAPHORE_WMS_LOG_LEVEL || process.env.SEMAPHORE_LOG_LEVEL || logLevel;

var mongoose = require('mongoose');
mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongo DB connection error:'));
db.once('open', function callback () {
  //require('modex')(app, {routeManagers: [config.adminModule, config.homeModule], moduleSettings: config.modules});
  //console.log(process.memoryUsage());
  modex(app, {moduleSettings: config.modules});
  //console.log(process.memoryUsage());
 
  app.listen(config.port, function(){
    logger.info("%s version %s listening on port %d in %s mode", config.appName, config.appVersion, config.port, app.settings.env);
  });
});


process.on('exit', function() {
  logger.info('Exiting from %s', config.appName);
});
process.on('SIGTERM', process.exit);
process.on('SIGINT', process.exit);
