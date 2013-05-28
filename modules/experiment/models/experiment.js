var mongoose = require('mongoose'), ObjectId = mongoose.Schema.Types.ObjectId;

var experimentSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  owner: { type: ObjectId, ref: 'user'},
  desc: { type: String, multiline:true },
  workflow: { type: ObjectId, ref: 'workflow'},
  keywords: [String],
  geocov: String,
  temcov: String,
  files: [{name: String, url: String}],
  runs: [{timestamp: Date, name: String, status: String}]
});

module.exports = mongoose.model('experiment', experimentSchema, 'experiment');
