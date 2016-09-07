// REST API with express
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());

// LOGGER
var logFactory = require('./log.js');
var logger = logFactory.create("rest");

var websocket = require('./websocket.js');

app.post('/', function(req, response){

  try {
    logger.info("Received request ", req.body);
    var notification = {type: 'notification', text:req.body.text};
    websocket.broadcastJson(notification, "esp8");

  } catch (e) {
    logger.error("Unable to process request " + e);
    response.json({error: e});
  }
});

app.listen(8988);

logger.info("Rest API started on port 8988");
