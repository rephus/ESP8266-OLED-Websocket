
var ws = require("nodejs-websocket");

var connections = {};

var server = ws.createServer(function (conn) {

  var connectionId = conn.key;

    console.log("New connection: " +connectionId);

     connections[connectionId] = {
       id: connectionId,
       created: new Date().getTime(),
     };
    console.log("Total connections " + Object.keys(connections).length);

    var interval = setInterval(function(){
      console.log("Sending data");
      var data = "" + new Date().getTime();
      for (var c in connections){
        var connection = connections[c];

        conn.sendText(data);
      }
    },1000);

    conn.on("text", function (str) {
        console.log("Received "+str);
    });

    conn.on("close", function (code, reason) {
        console.log("Connection closed ", connectionId);

        delete connections[connectionId];
        console.log("Total connections " + Object.keys(connections).length);
        clearInterval(interval);
    });

}).listen(8001);

console.log("Websocket server started");

var sendJson = function(conn, json){
  conn.sendText(JSON.stringify(json));
};
