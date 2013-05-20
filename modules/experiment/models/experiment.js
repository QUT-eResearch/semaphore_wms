var mongoose = require('mongoose'), ObjectId = mongoose.Schema.Types.ObjectId;

var experimentSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  owner: ObjectId,
  description: String,
  keywords: [String],
  geocov: String,
  temcov: String
});

module.exports = mongoose.model('experiment', experimentSchema, 'experiment');
