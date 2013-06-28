"use strict";
var EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();
var sockjs  = require('sockjs');
var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.3.min.js"};

/**
 * Implements message format in JSON as follows:
 * {
 *   type: event_type
 * , id: event_id
 * , data: any_json_data
 * }
*/
exports = module.exports = function(mod, manager) {
  mod.meta('route', 'websocket');
  mod.addView('test.ejs');
  
  var wsServer = mod.server = sockjs.createServer(sockjs_opts);
  wsServer.installHandlers(manager.server, {prefix:mod.routePath});
  manager.server.addListener('upgrade', function(req,res){ res.end(); });
  var connections = {};
  wsServer.on('connection', function(conn) {
    //connections.push[conn];
    if (conn) {
      //console.log(conn);
      conn.on('data', function(message){
        //console.log('!!!!!!!!!!!!!!!!!!!!!!!!!');
        try {
          var data = JSON.parse(message);
          //console.log(data);
          if (data.type === "register") {
            var c = connections[data.id];
            if (!c) c = connections[data.id] = {};
            if (!(conn.id in c)) c[conn.id] = conn;
          } else if (data.type === "message") {
            event.emit(data.id, data.data);
          }
        } catch (err) {
          console.error(err);
        }
      });
      conn.on('close', function(){
        for (var id in connections) {
          delete connections[id][conn.id];
        }
      });
    }
  });
  
  mod.onMessage = function(id, listener) {
    event.on(id, listener);
  };
  
  mod.broadcast = function(id, data) {
    //console.log('broadcast: %s', id);
    //console.log(data);
    //console.log(connections);
    var conns = connections[id];
    var msg = JSON.stringify({id:id, type:'message', data:data});
    for (var connId in conns) {
      conns[connId].write(msg);
    }
  };

  mod.init(function(){
    //console.log('websocket: ' + mod.routePath);
    mod.mount('get', '', {route:'/testws'}, function(req, res){ res.respond({_view:'test'}); } );
  });
  
};
