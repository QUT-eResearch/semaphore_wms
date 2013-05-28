var mongoose = require('mongoose'), ObjectId = mongoose.Schema.Types.ObjectId;

var workflowSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  owner: { type: ObjectId, ref: 'user'},
  desc: { type: String, multiline:true },
  keywords: [String],
  data: { },
  access: { }
});

module.exports = mongoose.model('workflow', workflowSchema, 'workflow');
