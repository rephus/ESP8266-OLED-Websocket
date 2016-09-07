var ws = require("nodejs-websocket");

// LOGGER
var logFactory = require('./log.js');
var logger = logFactory.create("websocket");

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

var start = function(){
  var processor = require('./processor.js');

   ws.createServer(function (conn) {

  var connectionId = conn.key;

    logger.info("New connection: " +connectionId);

     clients[connectionId] = {
       id: connectionId,
       created: new Date().getTime(),
       connection: conn,
       device: undefined
     };
    logger.info("Total connections " + Object.keys(clients).length);

    conn.on("text", function (str) {
        //logger.info("Received TEXT from "+connectionId+ ": "+str);
        try {
          var json = JSON.parse(str);
          processor.processJson(connectionId, json);
        } catch(e){
          logger.info("Unable to parse json "+ str+": "+e);
        }
    });

    conn.on("close", function (code, reason) {
        logger.info("Connection closed ", connectionId);

        delete clients[connectionId];
        logger.info("Total connections " + Object.keys(clients).length);
        //clearInterval(interval);

        sendClients();
    });

  }).listen(8001);

  logger.info("Websocket server started on port 8001");

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

  logger.info("Sending message "+ message + " to devices " + device);

  for (var c in clientIds ){
    var client = clients[clientIds[c]];
    if (!device || (device && client.device == device)) {
      var conn = client.connection;
      conn.sendText(message);
    }
  }
};

var sendJson = function(conn, json){
  conn.sendText(JSON.stringify(json, null, 2));
};

module.exports = {
  broadcastJson: broadcastJson,
  sendClients:  sendClients,
  clients: clients,
  start: start
};
