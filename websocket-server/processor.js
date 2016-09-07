// LOGGER
var logFactory = require('./log.js');
var logger = logFactory.create("processor");

var websocket = require('./websocket.js');

console.log("websocket ", websocket);
module.exports = {
  processJson: function(connectionId, json){

    try {
      var type = json.type;
      switch (json.type) {
        case "message":
        //Forward message to esp8
          websocket.broadcastJson(json, "esp8");
          break;
        case "ip":
            logger.info("Device IP "+ json.value);
            break;
        case "device":
          logger.info("Updating device "+connectionId+ ": "+ json.value);
          websocket.clients[connectionId].device = json.value;
          websocket.sendClients();
          break;

        case "time":

          var now = new Date();
          var offset = now.getTimezoneOffset() * 60; // add offset from tiemzone in seconds
          var seconds = parseInt( now.getTime() / 1000); // in seconds
          logger.info("Sending time to  "+connectionId +": "+ seconds + " with offset " + offset);

          var time = {
            "type": "time",
            "value": seconds - offset
          };
          websocket.broadcastJson(time, "esp8");
          break;
        case "log":
          logger.info("Log: "+ json.value);
          break;
        case "stats":
          logger.info("Stats: " + JSON.stringify(json) );
          break;
        default:
          logger.warn("Unrecognized message type: "+ type, json);

      }
    } catch (e) {
      logger.error("Unable to process json" + JSON.stringify(json)+": "+ e);
    }
  }
};
