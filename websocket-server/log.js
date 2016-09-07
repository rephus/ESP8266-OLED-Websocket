var winston = require('winston');

module.exports = {

    create: function(name) {
      return new (winston.Logger)({
        transports: [
          new (winston.transports.Console)({
            formatter: function(options) {
              return getTime() + " ["+options.level.toUpperCase() +'] ' + name + ': '+ options.message;
            }
          })
        ]
      });
    }
}

var getTime = function(){
  var d = new Date();
  return d.getHours() + ":"+d.getMinutes()+  ":"+ d.getSeconds();
}
