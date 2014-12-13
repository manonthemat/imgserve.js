var winston = require('winston');
var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: 'debug',
      colorize: true
    }),
    new (winston.transports.DailyRotateFile)({
      level: 'debug',
      filename: __dirname + '/../logs/imgserve',
      datePattern: '.yyyy-MM-dd'
    })
  ]
});

module.exports = logger;
