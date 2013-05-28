"use strict"

var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
//exports.layoutLocals = {};
//var menu = exports.layoutLocals.menu = [{menu:[]},{menu:[]}];
var menu;
var menuMap;
var menuTemplate;
//var modUser;
//var fullRoute;

module.exports = function(mod) {
  mod.meta('route', '/admin');
  mod.addView('layout.ejs');
  mod.addView('index.ejs');
  mod.addStatic('static');
  
  mod.setResourceHandler(resourceHandler);
  mod.setPartialView('menu', menuPartial);
  
  menuTemplate = ejs.compile(fs.readFileSync(path.join(__dirname, 'partial_menu.ejs'), 'utf8'));
  //fullRoute = mod.fullRoute;
  menu = [{label:'Home', link:mod.fullRoute},{menu:[]},{menu:[]}];
  menuMap = {
    'home' : menu[0],
    'system' : menu[1],
    'user' : menu[2]
  };
  
  mod.init(function(mod, manager) {
    manager.app.locals._user = null; //ensure _user variable is available in any views
    mod.mount('get', '', index); //relative: /admin
  });
  /*
  mod.setLocalsHandler(function(layout, options){
    console.log('setLocalsHandler: %s : %s', layout, options);
    console.log(options);
    options.mainMenu = menu;
  });
  mod.setViewHandler('layout', function(params) {
    return function(err, partialBody) {
      params.helper
      return params.render(params.view, params.options, params.callback);
    }
  });
  */
  
};

function menuPartial() {
  //load view, render, return the string
  return menuTemplate({mainMenu: menu});
}


function index(req, res, next) {
  res.respond({_view:'index', _layout:'layout', title:'test', mainMenu:menu});
}

function resourceHandler(ownerModule, resourceName, absroute) {
  var modName = ownerModule.name;
  var modLabel = ownerModule.meta('label');
  var menuItem = menuMap[modName];
  console.log('rh: %s - %s', modLabel, resourceName);
  if (!menuItem) {
    menuItem = {menu:[]};
    menu.push(menuItem);
    menuMap[modName] = menuItem;
  }
  menuItem.label = modLabel;
  menuItem.link = ownerModule.getRoutePath();
  menuItem.menu.push({label: resourceName, link: absroute});
}

