"use strict";
var mongoose = require('mongoose'), ObjectId = mongoose.Schema.Types.ObjectId;
var request = require('request');
var openstack = require('openstack');
var swift;
var model;
var container;
var containerKey;

module.exports = function init(mod) {
  if (!swift) {
    var storageConfig = mod.meta('storage');
    swift = openstack.createClient(storageConfig.auth);
    container = storageConfig.container;
    swift.createContainer({container:container}, function(err){
      if (err) console.log(err);
    });
    // set random key for tempurl
    require('crypto').randomBytes(16, function(ex, buf) {
      containerKey = buf.toString('hex');
      swift.setMetaTempUrl(containerKey);
      //console.log(containerKey);
    });
  }
  return model;
};

/**
  refs is in the format of key-value pair of experiment._id and array of run._id:
  ref[experiment._id] = [run._id]
*/
var versionSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  url: { type: String },
  desc: { type: String },
  refs: [String] 
}, { _id: false});

var fileSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  versions: [versionSchema]
}, { _id: false});

var runSchema = new mongoose.Schema({
  timestart: Date,
  timefinish: Date,
  name: {type:String, unique:true},
  desc: String,
  status: String,
  infiles:[],
  outfiles:[],
  messages: [String]
});

var experimentSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  owner: { type: ObjectId, ref: 'user'},
  desc: { type: String, multiline:true },
  workflow: { type: ObjectId, ref: 'workflow', required:true},
  keywords: [String],
  geocov: String,
  temcov: String,
  files: [fileSchema],
  runs: [runSchema]
});

function findFileByName(files, name) {
  var f;
  files.some(function(file) { 
    if (file.name == name) { 
      f = file; 
      return true; 
    }
  });
  return f;
}
function findVersion(files, name, versionId) {
  var f = findFileByName(files, name);
  var version;
  f.versions.some(function(v){
    if (v.id == versionId) {
      version = v;
      return true;
    }
  });
  return version;
}

experimentSchema.methods.addLocalInput = function(filename, filepath, cb){
  var files = this.files;
  var versionId = Date.now();
  var remote = getInputFilePath(this._id, filename, versionId);
  var headers = {'Content-Disposition': 'attachment; filename='+filename};
  swift.upload({container:container, remote:remote, local:filepath, headers:headers}, function(err) {
    var f = findFileByName(files, filename);
    var v = {id:versionId};
    if (f) {
      f.versions.push(v);
    } else {
      f = {name: filename, versions:[v]};
      files.push(f);
    }
    cb(f);
  });
};

// {expId}/{input|output}/{filename}/{version}
experimentSchema.methods.addRemoteInput = function(filename, url, cb){
  var files = this.files;
  var versionId = Date.now();
  var remote = getInputFilePath(this._id, filename, versionId);
  var headers = {'Content-Disposition': 'attachment; filename='+filename};
  var stream = request.get(url);
  swift.upload({container:container, remote:remote, stream:stream, headers:headers}, function(err) {
    var f = findFileByName(files, filename);
    var v = {id:versionId};
    if (f) {
      f.versions.push(v);
    } else {
      f = {name: filename, versions:[v]};
      files.push(f);
    }
    cb(f);
  });
};

experimentSchema.methods.linkRemoteInput = function(filename, url){
  var files = this.files;
  var f = findFileByName(files, filename);
  var versionId = Date.now();
  var v = {id:versionId, url:url};
  if (f) {
    f.versions.push(v);
  } else {
    f = {name: filename, versions:[v]};
    files.push(f);
  }
};

experimentSchema.methods.removeInput = function(filename, versionid, cb) {
  //console.log('versionid: %s', versionid);
  var files = this.files;
  var expId = this._id;
  var self = this;
  var fileIndex = -1;
  var versionIndex = -1;
  files.some(function(f, i) {
    if (f.name === filename) {
      fileIndex = i;
      if (versionid) f.versions.some(function(v, j) {
        if (v.id == versionid) {
          versionIndex = j;
          return true;
        }
      });
      return true;
    }
  });
  //console.log('fileIndex: %s', fileIndex);
  //console.log('versionIndex: %s', versionIndex);
  if (fileIndex >= 0) {
    var file = files[fileIndex];
    if (versionIndex >= 0) {
      // delete version
      var version = file.versions[versionIndex];
      if (version.refs && version.refs.length > 0) {
        return cb(new Error('Cannot delete file: `' + filename + '`, version: ' + versionIndex + '. The file is used by runs: ' + version.refs.toString()));
      }
      if (file.versions.length > 1) {
        file.versions.splice(versionIndex, 1);
        self.markModified('files['+fileIndex+'].versions');
      } else {
        file.versions = [];
      }
      if (!version.url) {
        var remote = getInputFilePath(expId, filename, versionid);
        swift.removeFile(container, remote, removeFile);
      } else {
        removeFile();
      }
    } else {
      // no version, delete the file
      removeFile();
    }
  } else {
    cb();
  }
  function removeFile() {
    if (file.versions.length === 0) {
      files.splice(fileIndex, 1);
      self.markModified('files');
    }
    cb();
  }
};

experimentSchema.statics.addRun = function(id, options, cb) {
  this.findById(id, '_id workflow files runs', {populate:'workflow'}, function(err, exp){
    if (err) return cb(err);
    var run = {};
    var inputFiles = {};
    run.timestart = Date.now();
    run.name = options.name || ('Run ' + exp.runs.length + 1);
    run.desc = options.desc;
    run.status = 'error';
    run.infiles = [];
    //filename: versionid pair
    exp.files.forEach(function (file) {
      var url;
      var versionId = options.infiles[file.name];
      if (versionId) {
        file.versions.some(function(version){ 
          if (version.id === versionId) {
            version.refs.push(run.name);
            url = version.url;
            return true;
          } 
        });
        inputFiles[file.name] = url || internalInputUrl(exp._id, file.name, versionId, 99999999);
        run.infiles.push({name:file.name, versionId:versionId, url:url});
      }
    });
    run.outfiles = [];
    exp.runs.push(run);
    run = exp.runs[exp.runs.length-1];
    var data = {
      outputFilesPath : getOutputPath(id, run._id),
      inputFiles : inputFiles,
      onRun : options.baseUrl + '/' + run._id + '/run',
      onEnd : options.baseUrl + '/' + run._id + '/end'
    };
    exp.save(function(err){
      if (err) return cb(err);
      // run workflow
      if (exp.workflow) {
        exp.workflow.run(data, function(err){
          run.status = 'queue';
          cb(null, run);
        });
      } else {
        cb(new Error('Invalid workflow'), run);
      }
    });
  });
};

function removeOutputFile(file, cb) {
  var i = file.url.indexOf('/'+container+'/') + container.length;
  var remote = file.url.substring(i);
  swift.removeFile(container, remote, cb);
}

experimentSchema.statics.removeRun = function(expId, runId, cb) {
  this.findById(expId, '_id files runs', {}, function(err, exp) {
    if (err || !exp) return cb(err);
    var run = exp.runs.id(runId);
    //delete output files
    var count = run.outfiles.length;
    if (count === 0) removeReferences();
    else run.outfiles.forEach(function(file) {
      removeOutputFile(file, function(){
        count--;
        if (count === 0) removeReferences();
      });
    });
    function removeReferences() {
      //remove reference to input files
      run.infiles.forEach(function(file) {
        var version = findVersion(exp.files, file.name, file.versionId);
        version.refs.remove(run.name);
      });
      //remove run from runs
      run.remove();
      //save
      exp.save(cb);
    }
  });
};

experimentSchema.statics.updateRun = function(expId, runId, status, data, cb) {
  var updates = {};
  updates['runs.$.status'] = status;
  if (data.errors) updates['runs.$.messages'] = data.errors;
  if (data.outputFiles) {
    var outfiles = updates['runs.$.outfiles'] = [];
    Object.keys(data.outputFiles).forEach(function(key){
      //outfiles.push({name:key, url:data.outputFiles[key]});
      outfiles.push({name:key, url:getOutputFilePath(expId, runId, key)});
    });
  }
  if (status === 'end') updates['runs.$.timefinish'] = Date.now();
  //console.log(updates);
  this.findOneAndUpdate({_id:expId, 'runs._id':runId}, { $set: updates }, {select:'runs'}, function(err, exp){
    var urun;
    if (exp) {
      var run = exp.runs.id(runId);
      urun = {
        _id : run._id,
        status : run.status,
        messages : run.messages,
        outfiles : run.outfiles,
        timefinish : run.timefinish
      };
    }
    cb(err, urun);
  });
};

experimentSchema.statics.removeById = function(expId, cb) {
  this.findById(expId, function(err, exp) {
    //remove runs output files
    exp.runs.forEach(function(run){
      run.outfiles.forEach(function(file) {
        removeOutputFile(file, function(){});
      });
    });
    //remove input files
    exp.files.forEach(function(file) {
      file.versions.forEach(function(version) {
        if (!version.url) {
          var remote = getInputFilePath(expId, file.name, version.id);
          swift.removeFile(container, remote, function(){});
        }
      });
    });
  });
  this.remove({_id:expId}, cb);
};

experimentSchema.statics.getFile = function(options, cb) {
  var remote;
  if (options.category === 'input') {
    remote = getInputFilePath(options.expId, options.filename, options.verId);
  } else if (options.category === 'output') {
    remote = getOutputFilePath(options.expId, options.runId, options.filename);
  }
  swift.download({container:container, remote:remote}, cb);
};

experimentSchema.statics.internalInputUrl = internalInputUrl;
experimentSchema.statics.internalOutputUrl = internalOutputUrl;
experimentSchema.statics.getInputFilePath = getInputFilePath;
experimentSchema.statics.getOutputFilePath = getOutputFilePath;

function internalInputUrl(id, filename, version, duration) {
  duration = duration || 10;
  var remote = getInputFilePath(id, filename, version);
  return swift.createTempUrl({method:'GET', container:container, remote:remote, filename:filename, key:containerKey, duration:duration});
}

function internalOutputUrl(id, runId, filename, duration) {
  duration = duration || 10;
  var remote = getOutputFilePath(id, runId, filename);
  return swift.createTempUrl({method:'GET', container:container, remote:remote, filename:filename, key:containerKey, duration:duration});
}

function getInputFilePath(expId, filename, version) {
  return expId + '/input/' + filename + '/' + version;
}

function getOutputFilePath(expId, runId, filename) {
  return expId + '/output/' + runId + '/' + filename;
}

function getOutputPath(expId, runId) {
  return container + '/' + expId + '/output/' + runId;
}

model = mongoose.model('experiment', experimentSchema, 'experiment');