var mongoose = require('mongoose'), ObjectId = mongoose.Schema.Types.ObjectId;

var roleSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  acl: String,
});

module.exports = mongoose.model('user_role', roleSchema, 'user_role');
