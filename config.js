var path = require('path');
var c = {};

c.appName = 'Semaphore';
c.appVersion = '0.0.1';

c.port = process.env.SEMAPHORE_PORT || '3001';
c.host = process.env.SEMAPHORE_HOST || 'localhost';
c.behindProxy = true;
c.cookieSecret = 'semaphore_wms:aZ1sFokuX9bi65d38';
c.viewEngine = 'ejs';
c.viewEngines = { 'ejs':'ejs-locals', 'html':'hogan-express' };

c.pathBaseData = 'C:\\temp';
c.pathTempUpload = path.join(c.pathBaseData, 'upload');
c.pathJobData = path.join(c.pathBaseData, 'jobs');
c.urlJobData = 'http://'+c.host+'/files/';

c.mongodb = {};
c.mongodb.host = process.env.SEMAPHORE_MONGODB_HOST || 'localhost';
c.mongodb.port = process.env.SEMAPHORE_MONGODB_PORT || 27017;
c.mongodb.database = 'semaphore_cms';

c.paths = {};
//c.paths.modules = 'modules'; //default is modules
c.paths.views = 'views';
c.paths.statics = ['public'];

c.homeModule = 'main';
c.adminModule = 'admin';
c.modules = {};
// general setting for modex
c.modules[''] = {
  interfaceProviders:{
    backend:'admin',
    frontend:'main',
    api:''
  }
//  ,viewType:'basic' //choose a view folder from modex/views
//  ,viewEngines
};
c.modules['auth'] = { 
  route:'', 
  priority:0,
  login:'/login', 
  logout:'/logout',
  secure: [
    { module:'admin', authorize:'admin.authorize', routes:['all *'] },
    { module:'main', routes:['experiment.*']}
  ],
  authenticate: 'user.authenticate'
};
c.modules['admin'] = { route:'/admin', priority:1 };
c.modules['main'] = { route:'/', priority:2 };
c.modules['experiment'] = { route:'exps', priority:3, parent:'main' };

c.getPathToJobDataFile = function(jobId, fileName) {
  return path.join(c.pathJobData, jobId, fileName)
}
c.getUrlToJobDataFile = function(jobId, fileName) {
  return c.urlJobData + jobId + '/' + fileName;
}

c.jobTypes = {
  century: 'century',
  daycent: 'daycent',
  kepler: 'kepler'
};

c.str = {};
c.str.paramJsonInput = 'JsonInput';
c.str.paramJsonInputFiles = 'JsonInputFiles';
c.str.paramInputFiles = 'InputFiles';

module.exports = c;