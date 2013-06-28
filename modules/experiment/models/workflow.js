var mongoose = require('mongoose'), ObjectId = mongoose.Schema.Types.ObjectId;
var request = require('request');

var schema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  owner: { type: ObjectId, ref: 'user'},
  desc: { type: String, multiline:true },
  keywords: [String],
  url: String,
  data: { },
  access: { }
});

schema.methods._label = function() { return this.name; };
schema.statics._labelFields = 'name';

schema.methods.run = function(data, cb) {
  var url = this.url;
  var body = { type:this.name, data:data };
  //console.log(url);
  //console.log(body);
  request({method:'POST', url:url, json:body}, cb);
  process.nextTick(cb);
};

module.exports = mongoose.model('workflow', schema, 'workflow');
