var mongoose = require('mongoose'), ObjectId = mongoose.Schema.Types.ObjectId;

var userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  fullname: String,
  password: { type: String, select: false },
  email: String,
  isSuperuser: Boolean
  //roles: [{ type: ObjectId, ref: 'user_role' }]
  //isActive: Boolean
  //createdAt updatedAt createdBy, updatedBy
  //isDeleted
});

userSchema.statics._labelFields = 'username fullname';
userSchema.methods.resetPassword = function() {
};
userSchema.methods._label = function() {
  return this.username + ' (' + this.fullname + ')';
};

userSchema.statics.authenticate = function(username, password, callback) {
  this.findOne({username:username, password:password}, null, {lean:true}, function(err, user){
    callback(user);
  });
}

module.exports = mongoose.model('user', userSchema, 'user');

