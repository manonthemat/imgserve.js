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
// nickname preset to local hostname
var hostname = require('os').hostname().split('.')[0]
logger.add(require('winston-irc'), {
  host: 'your.irc.com',
  nick: hostname,
  pass: '',
  level: 'error',
  channels: {
    '#imgserve': true,
  }
});
*/
module.exports = logger;
