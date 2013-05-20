var mUser = require('../models/user');
var BasicCrud = require('modex').controllers.BasicCrud;
var cUser = module.exports = new BasicCrud({model: mUser});
cUser._actions.push('test');
//cUser.list_fields = '-password';
//cUser.show_fields = cUser.edit_fields = cUser.confirmDelete_fields = '-password';
//cUser.new_fields = '-roles';

cUser.test = function(req, res, next){
  res.send('test');
};
cUser.test_method = 'get';
cUser.test_path = '/test';

