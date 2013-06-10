var mongoose = require('mongoose'), ObjectId = mongoose.Schema.Types.ObjectId;

var schema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  owner: { type: ObjectId, ref: 'user'},
  desc: { type: String, multiline:true },
  keywords: [String],
  data: { },
  access: { }
});

schema.methods._label = function() { return this.name; };
schema.statics._labelFields = 'name';

module.exports = mongoose.model('workflow', schema, 'workflow');
