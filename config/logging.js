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
/*
// for IRC logging, edit this section and remove the block comment
logger.add(require('winston-irc'), {
  host: 'your.irc.com',
  nick: 'imgserve',
  pass: '',
  level: 'error',
  channels: {
    '#imgserve': true,
  }
});
*/
module.exports = logger;
