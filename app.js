"use strict";

/**
 * Module dependencies.
 */
var config = require('./config');
var createLogger = config.createLogger = require('jsx').createLogger;
var logger = createLogger(module);
var logLevel = 'debug';
// The default log levels: debug|0, info|1, warn|2, error|3, fatal|4
createLogger.level = process.env.SEMAPHORE_WMS_LOG_LEVEL || process.env.SEMAPHORE_LOG_LEVEL || logLevel;

config.env = {
  'development' : function(app, express){
    app.use(express.logger('dev'));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    logLevel = 'debug';
  }
, 'production' : function(app, express){
    //app.enable('view cache');
    //app.use(express.logger('tiny'));
    app.use(express.errorHandler());
    logLevel = 'info';
  }
};

var mongoose = require('mongoose');
mongoose.connect('mongodb://' + config.mongodb.host + ':' + config.mongodb.port + '/' + config.mongodb.database);
var db = mongoose.connection;
db.on('error', logger.error.bind(logger, 'Mongo DB connection error:'));
db.once('open', function callback() {
  //require('modex')(app, {routeManagers: [config.adminModule, config.homeModule], moduleSettings: config.modules});
  //console.log(process.memoryUsage());
  var manager = require('modex')(config);
  var action = process.argv[2];
  var mods = process.argv.slice(3);
  if (action in {'install':0, 'uninstall':0, 'enable':0, 'disable':0, 'debug-modules':0}) {
    manager[action](mods);
    //setTimeout(process.exit.bind(process, 0), 2000);
  } else {
    manager.start();
  }
});
process.on('exit', function() {
  db.close();
  logger.info('Exiting from %s', config.appName);
});
process.on('SIGTERM', process.exit);
process.on('SIGINT', process.exit);
