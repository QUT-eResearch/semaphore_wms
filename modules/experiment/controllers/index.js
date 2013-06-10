var modex = require('modex');
var BasicCrud = modex.controllers.BasicCrud;
var Workflow = require('../models/workflow');
var Experiment = require('../models/experiment');
var fs = require('fs');
var swift = require('openstack').createClient(modex.app.get('config').nectarAuth);
//var logger = require('jsx').createLogger(module)'

var c = module.exports = new BasicCrud({
  model: Experiment,
  defaultFormat:'json',
  actions: 'ui list show create update workflowList uploadInput downloadInput removeInput'
});

c.ui = function(req, res) {
  res.respond({_view:'ui', _layout:'layout', title:'Experiment Manager'});
};
c.ui_route = '.ui/';
c.ui_format = 'html';


c.list_filter = function(req) {
  //console.log(req.session);
  return {owner: req.session.user._id};
};
c.list_fields = '-files -runs';
c.list_populate = c.show_populate = c.create_populate = [{path:'workflow', select:'_id name'}];
c.list_sort = 'name';

c.create_pre.push(function(req, res, next) {
  req.body.owner = req.session.user._id;
  next();
});

c.workflowList = function(req, res) {
  var c = this;
  var query = Workflow.find({}, c.workflowList_fields, {lean:true}, function(err, records){
    if (err) return next(err);
    res.json(records);
  });
};
c.workflowList_method = 'get';
c.workflowList_route = '.wf';
c.workflowList_fields = '_id name';

c.uploadInput = function(req, res) {
  if (req.body.uploadType == 'remoteLink') {
    if (req.body.filename && req.body.url) {
      Experiment.findById(req.params.id, function(err, doc){
        if (err) return next(err);
        doc.linkRemoteInput(req.body.filename, req.body.url);
        doc.save(function() { 
          res.send(doc.files); 
        });
      });
    } else {
      res.send({message:'error'});
    }
  } else if (req.body.uploadType == 'remoteUpload') {
    if (req.body.filename && req.body.url) {
      Experiment.findById(req.params.id, function(err, doc){
        if (err) return next(err);
        doc.addRemoteInput(req.body.filename, req.body.url, function(){
          doc.save(function() { 
            res.send(doc.files); 
          });
        });
      });
    } else {
      res.send({message:'error'});
    }
  } else {
    // handle upload
    if (!req.files) {
      res.send({message:'error'});
      return;
    }
    var files = req.files.inputFiles;
    if (!Array.isArray(files)) files = [files];
    var left = files.length;
    var validCount = 0;
    
    Experiment.findById(req.params.id, function(err, doc){
      if (err) return next(err);
      files.forEach(function(file){
        if (file.name) doc.addLocalInput(file.name, file.path, function(){
          validCount++;
          //console.log('validCount: %s',validCount);
          completed(file.path); 
        });
        else completed(file.path);
      });
      function completed(fp) {
        //console.log('completed: ' + left);
        fs.unlink(fp, function(err){
          if (err) console.err(err);
        });
        left--;
        if (left === 0) {
          var str = JSON.stringify(doc.files);
          if (validCount > 0) {
            doc.save(function() { res.send(str); });
          } else {
            res.send(str);
          }
        }
      }
    });
  
  }
};
c.uploadInput_method = 'post';
c.uploadInput_route = '/:id/uploadInput';
c.uploadInput_pre = [modex.parseBodyUpload];

c.downloadInput = function(req, res) {
  var tempurl = Experiment.internalInputUrl(req.params.id, req.params.filename, req.params.version);
  //console.log(tempurl);
  res.redirect(tempurl);
};
c.downloadInput_method = 'get';
c.downloadInput_route = '/:id/input/:filename/:version';


c.removeInput = function(req, res) {
  Experiment.findById(req.params.id, function(err, doc){
    doc.removeInput(req.params.filename, req.params.version, function(){
      doc.save(function(err){
        console.log(err);
        console.log(doc.files);
        res.send(doc.files);
      });
    });
  });  
};
c.removeInput_method = 'delete';
c.removeInput_route = '/:id/input/:filename/:version?*';
