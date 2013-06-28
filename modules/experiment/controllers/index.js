"use strict";
var fs = require('fs');
var path = require('path');
var modex = require('modex');
var BasicCrud = modex.controllers.BasicCrud;
//var logger = require('jsx').createLogger(module)'

module.exports = function init(mod) {
  var Workflow = mod.model('workflow');
  var Experiment = mod.model('experiment');
  
  var c = new BasicCrud({
    model: Experiment,
    defaultFormat:'json',
    actions: 'ui dataViewer list show create update delete workflowList workflowShow uploadInput downloadInput removeInput addRun removeRun updateRunStatus downloadOutput'
  });
  
  c.ui = function(req, res) {
    res.respond({_view:'ui', _layout:'layout', title:'Experiment Manager'});
  };
  c.ui_method = 'get';
  c.ui_route = '.ui/';
  c.ui_format = 'html';

  c.dataViewer = function(req, res, next) {
    var opts = {};
    opts.expId = req.query.expId;
    opts.expName = req.query.expName;
    opts.category = req.query.category;
    opts.filename = req.query.filename;
    if (opts.category==='input') {
      opts.verId = req.query.verId;
      opts.path = Experiment.getInputFilePath(opts.expId, opts.filename, opts.verId);
    } else if (opts.category==='output') {
      opts.runId = req.query.runId;
      opts.runName = req.query.runName;
      opts.path = Experiment.getOutputFilePath(opts.expId, opts.runId, opts.filename);
    }
    opts._view = 'viewer';
    opts.title = 'Data Viewer';
    opts.data = {};
    var ext = path.extname(opts.filename);
    if (!ext || ext === '.bin') {
      opts.dataType = 'text';
      opts.data[opts.dataType] = 'Cannot view binary file.';
      res.respond(opts);
    } else {
      opts.dataType = 'table';
      Experiment.getFile(opts, function(e, r, body) {
        //console.log(typeof body);
        //console.log(body);
        var lines = body.split(/\r\n|\n/);
        var rows = [];
        if (ext === '.csv') {
          lines.forEach(function(row) {
            row = row.trim();
            if (row) rows.push(row.split(','));
          });
        } else if (ext === '.lis' || ext === '.out') {
          lines.forEach(function(row) {
            row = row.trim();
            if (row) rows.push(row.split(/\s+/));
          });
        } else {
          opts.dataType = 'text';
          rows = body;
        }
        opts.data[opts.dataType] = rows;
        res.respond(opts);
      });
    }
  };
  c.dataViewer_method = 'get';
  c.dataViewer_route = '.ui.viewer';
  c.dataViewer_format = 'html';

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

  c.delete = function(req, res, next){
    Experiment.removeById(req.params.id, function(err) {
      if (err) return next(err);
      else res.send(204);
    });
  };
  c.delete_method = 'delete';
  c.delete_route = '/:id';
  
  c.workflowList = function(req, res, next) {
    var query = Workflow.find({}, c.workflowList_fields, {lean:true}, function(err, records){
      if (err) return next(err);
      res.json(records);
    });
  };
  c.workflowList_method = 'get';
  c.workflowList_route = '.wf';
  c.workflowList_fields = '_id name';
  
  c.workflowShow = function(req, res, next) {
    var query = Workflow.findById(req.params.id, c.workflowList_fields, {lean:true}, function(err, record){
      if (err) return next(err);
      res.json(record);
    });
  };
  c.workflowShow_method = 'get';
  c.workflowShow_route = '.wf/:id';
  c.workflowShow_fields = '_id name';

  c.uploadInput = function(req, res, next) {
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

  c.downloadOutput = function(req, res) {
    var tempurl = Experiment.internalOutputUrl(req.params.id, req.params.runId, req.params.filename);
    res.redirect(tempurl);
  };
  c.downloadOutput_method = 'get';
  c.downloadOutput_route = '/:id/output/:runId/:filename';

  c.removeInput = function(req, res) {
    Experiment.findById(req.params.id, function(err, doc){
      doc.removeInput(req.params.filename, req.params.version, function(err){
        if (err) return res.send(403, err.toString());
        doc.save(function(err){
          //console.log(err);
          //console.log(doc.files);
          res.json(doc.files);
          //res.send(204);
        });
      });
    });  
  };
  c.removeInput_method = 'delete';
  c.removeInput_route = '/:id/input/:filename/:version?*';

  c.addRun = function(req, res) {
    //console.log(req.params.id);
    //console.log(req.body);
    req.body.baseUrl = req.protocol + "://" + req.get('host') + req.url;
    if (!(req.body.infiles instanceof Object)) res.send(400);
    else Experiment.addRun(req.params.id, req.body, function(err, run){
      if (err) res.send(400);
      else res.json(run);
    });
  };
  c.addRun_method = 'post';
  c.addRun_route = '/:id/runs';
  c.addRun_pre = [modex.parseBody];

  c.removeRun = function(req, res) {
    Experiment.removeRun(req.params.id, req.params.runId, function(err){
      if (err) res.send(400);
      else res.send(204);
    });
  };
  c.removeRun_method = 'delete';
  c.removeRun_route = '/:id/runs/:runId';

  /**
   * body: {errors:[String], outputFiles:{'<filename>':'<url>'}}
   */
  c.updateRunStatus = function(req, res, next) {
    //if (req.headers['experiment-run-token'] == '')
    var expId = req.params.id;
    var runId = req.params.runId;
    var status = req.params.status;
    if (expId && runId && status) {
      Experiment.updateRun(expId, runId, status, req.body, function(err, run) {
        if (err) return next(err);
        //console.log(expId);
        //console.log(runId);
        //console.log(status);
        //console.log(run);
        modex.module('websocket').broadcast('experiment:'+expId+'/runStatus', run);
        res.send(204);
      });
    } else {
      res.send(400);
    }
  };
  c.updateRunStatus_method = 'put';
  c.updateRunStatus_route = '/:id/runs/:runId/:status';
  c.updateRunStatus_pre = [modex.parseBody];
  
  return c;
};

