
var ws = require("nodejs-websocket");

var clients = {};

var clientsWithoutConnections = function(){
  var newClients = {};
  var clientIds = Object.keys(clients);

  for (var c in clientIds ){
      var client = clients[clientIds[c]];
      newClients[client.id] = {
        id: client.id,
        created: client.created,
        device: client.device
      };
  }
  return newClients;
};

var server = ws.createServer(function (conn) {

  var connectionId = conn.key;

    console.log("New connection: " +connectionId);

     clients[connectionId] = {
       id: connectionId,
       created: new Date().getTime(),
       connection: conn,
       device: undefined
     };
    console.log("Total connections " + Object.keys(clients).length);

    conn.on("text", function (str) {
        console.log("Received TEXT from "+connectionId+ ": "+str);
        try {
          var json = JSON.parse(str);
          processJson(connectionId, json);
        } catch(e){
          console.log("Unable to parse json "+ str+": "+e);
        }
    });


    conn.on("close", function (code, reason) {
        console.log("Connection closed ", connectionId);

        delete clients[connectionId];
        console.log("Total connections " + Object.keys(clients).length);
        //clearInterval(interval);

        sendClients();
    });

}).listen(8001);

var processJson = function(connectionId, json){

  var type = json.type;
  switch (json.type) {
    case "message":
      broadcast(json.value);
      break;
    case "device":
      console.log("Updating device "+connectionId+ ": "+ json.value);
      clients[connectionId].device = json.value;
      sendClients();
      break;

    case "time":

      var now = new Date();
      var offset = now.getTimezoneOffset() * 60; // add offset from tiemzone in seconds
      var seconds = parseInt( now.getTime() / 1000); // in seconds
      console.log("Sending time to  "+connectionId +": "+ seconds + " with offset " + offset);

      var time = {
        "type": "time",
        "value": seconds - offset
      };
      broadcastJson(time, "esp8");
      break;
  }
};

var sendClients = function(){
  var message = {clients: clientsWithoutConnections()};
  var txt = JSON.stringify(message, null, 2);
  broadcast (txt, "web");
};

var broadcastJson = function(json, device){
  var msg = JSON.stringify(json);
  broadcast(msg, device);
};

var broadcast = function(message, device){
  var clientIds = Object.keys(clients);

  for (var c in clientIds ){
    var client = clients[clientIds[c]];
    if (!device || (device && client.device == device)) {
      var conn = client.connection;
      conn.sendText(message);
    }
  }
};

//Send messages to all connected clients at the same time every 5 seconds
/*var interval = setInterval(function(){
  var data = "" + new Date().getTime();
  broadcast(data);
},5000);*/

console.log("Websocket server started");

var sendJson = function(conn, json){
  conn.sendText(JSON.stringify(json, null, 2));
};
