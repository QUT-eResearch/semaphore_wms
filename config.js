var path = require('path');
var logger = require('jsx').createLogger(module);
var c = {};
var env = process.env;

c.appName = 'Semaphore';
c.appVersion = '0.0.1';

if (!env.OS_USERNAME || !env.OS_PASSWORD || !env.OS_TENANT_NAME || !env.OS_TENANT_NAME || !env.OS_TENANT_ID) {
  logger.fatal('The environment must be set for: OS_USERNAME, OS_PASSWORD, OS_TENANT_ID, OS_TENANT_NAME, OS_AUTH_URL');
  process.exit(1);
}
c.nectarAuth = {};
c.nectarAuth.username = env.OS_USERNAME || '';
c.nectarAuth.password = env.OS_PASSWORD || '';
c.nectarAuth.tenantId = env.OS_TENANT_ID || '';
c.nectarAuth.tenantName = env.OS_TENANT_NAME || '';
c.nectarAuth.url = env.OS_AUTH_URL || '';
c.nectarAuth.serviceName = 'Object Storage Service';
c.nectarAuth.region = 'Qld';

c.port = env.SEMAPHORE_PORT || '3001';
c.host = env.SEMAPHORE_HOST || 'localhost';
c.behindProxy = true;
c.cookieSecret = 'semaphore_wms:aZ1sFokuX9bi65d38';
c.viewEngine = 'ejs';
c.viewEngines = { 'ejs':'ejs-locals', 'html':'hogan-express' };

c.urlJobData = 'http://'+c.host+'/files/';

c.mongodb = {};
c.mongodb.host = env.SEMAPHORE_MONGODB_HOST || 'localhost';
c.mongodb.port = env.SEMAPHORE_MONGODB_PORT || 27017;
c.mongodb.database = 'semaphore_cms';

c.paths = {};
//c.paths.modules = 'modules'; //default is modules
c.paths.baseData = '/home/nodejs/data';
c.paths.tempUpload = path.join(c.paths.baseData, 'upload/');;
c.paths.views = 'views';
c.paths.statics = ['public'];

c.executorUrl = 'http://semaphore.n2o.net.au/ws/executor/api/v0.2/jobs';

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
  priority:10,
  login:'/login', 
  logout:'/logout',
  secure: [
    { module:'admin', authorize:'admin.authorize', routes:['all *'] }
   , { module:'main', routes:['experiment.*']}
  ],
  authenticate: 'user.authenticate'
};
c.modules['websocket'] = { route:'/websocket', priority:0 };
c.modules['admin'] = { route:'/admin', priority:20 };
c.modules['admin.user'] = { /*dummySessionUser:{username:'admin', password:'admin'}*/ };
c.modules['main'] = { route:'/', priority:30 };
c.modules['experiment'] = { route:'exps', priority:31, storage: {auth:c.nectarAuth, container:'Semaphore.Experiments'}, executorUrl:c.executorUrl };

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

module.exports = c;