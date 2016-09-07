require('./rest.js');
var websocket = require('./websocket.js');
websocket.start();

// LOGGER
var logFactory = require('./log.js');
var logger = logFactory.create("server");

process.on('uncaughtException', function (err) {
    logger.error(err.stack);
    logger.info("Node NOT Exiting...");
});
