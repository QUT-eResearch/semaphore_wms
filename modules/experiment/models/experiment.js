var mongoose = require('mongoose'), ObjectId = mongoose.Schema.Types.ObjectId;
var request = require('request');

var refSchema = new mongoose.Schema({
  exp: { type: ObjectId, ref: 'experiment' },
  run: Number
}, { _id: false});

var versionSchema = new mongoose.Schema({
  id: { type: Number, unique: true },
  url: { type: String },
  desc: { type: String },
  refs: [refSchema]
}, { _id: false});

var fileSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  versions: [versionSchema]
}, { _id: false});

var experimentSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  owner: { type: ObjectId, ref: 'user'},
  desc: { type: String, multiline:true },
  workflow: { type: ObjectId, ref: 'workflow'},
  keywords: [String],
  geocov: String,
  temcov: String,
  files: [fileSchema],
  runs: [{timestamp: Date, name: String, status: String}]
});

var swift = require('openstack').createClient(require('modex').app.get('config').nectarAuth);

var container = 'Semaphore.Experiments';
var containerKey;

swift.createContainer({container:container}, function(err){
  if (err) console.log(err);
});

require('crypto').randomBytes(16, function(ex, buf) {
  containerKey = buf.toString('hex');
  swift.setMetaTempUrl(containerKey);
});

function findFileByName(files, name) {
  var f;
  files.some(function(file) { 
    if (file.name === name) { 
      f = file; 
      return true; 
    };
  });
  return f;
}

experimentSchema.methods.addLocalInput = function(filename, filepath, cb){
  var files = this.files;
  var fileBase = this._id + '/input/';
  var versionId = Date.now();
  var remote = fileBase + filename + '/' + versionId;
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
  var fileBase = this._id + '/input/';
  var versionId = Date.now();
  var remote = fileBase + filename + '/' + versionId;
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
  var fileIndex = versionIndex = -1;
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
      if (file.versions.length > 1) {
        file.versions.splice(versionIndex, 1);
        self.markModified('files['+fileIndex+'].versions');
      } else {
        file.versions = [];
      }
      if (!version.url) {
        var remote = expId + '/input/' + filename + '/' + versionid;
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

experimentSchema.statics.internalInputUrl = function(id, filename, version){
  var remote = id + '/input/' + filename + '/' + version;
  return swift.createTempUrl({method:'GET', container:container, remote:remote, filename:filename, key:containerKey});
}

module.exports = mongoose.model('experiment', experimentSchema, 'experiment');
