/** Module Manager */
var model = exports.model = {};
var controller = exports.controller = require('modex').createController('modules');

controller.list = function(req, res, next) {
  res.send('list');
  //res.respond(controller, {});
  //controller.respond(res, {});
};
controller.list_route = '';

controller.modify = function(req, res, next) {
  res.send('disable');
};
controller.modify_method = 'post';
controller.modify_route = '/:name';

