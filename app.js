var logger = require(__dirname + '/config/logging.js');
logger.info('logging started');
var express = require('express');
var app = express();
app.set('port', process.env.PORT || 8000);
var io = require('socket.io')(require('http').Server(app));
var fs = require('fs');
var mime = require('mime');
var env = process.env.NODE_ENV || 'development';
var aws_config = require(__dirname + '/config/aws.js')[env];
var AWS = require('aws-sdk');
AWS.config.accessKeyId = aws_config.AWS_ACCESS_KEY_ID;
AWS.config.secretAccessKey = aws_config.AWS_SECRET_ACCESS_KEY;
AWS.config.region = aws_config.region;
var s3bucket = new AWS.S3({params: {Bucket: aws_config.bucket}});
var twilio_config = require(__dirname + '/config/twilio.js')[env];
var twilio_client = require('twilio')(twilio_config.accountSid, twilio_config.authToken);
var sendgrid_config = require(__dirname + '/config/sendgrid.js')[env];
var sendgrid = require('sendgrid')(sendgrid_config.user, sendgrid_config.password);

var sass = require('node-sass');
sass.renderFile({
  file: __dirname + '/styles.scss',
  outFile: __dirname + '/assets/css/styles.css',
  outputStyle: 'compressed',
  success: function(css) {
    logger.info('CSS compiled');
  },
  error: function(err) {
    logger.error('Error compiling CSS');
    logger.error(err);
  }
});

function pushToBucket(data) {
  s3bucket.putObject(data, function(err, data) {
    if(err) logger.error("An error occured while trying to push to S3 bucket\n", err);
    else logger.info("push to s3 successful");
  });
}

function sendText(recipient, message, mediaUrl) {
  twilio_client.sendMessage({
    to: recipient,
    from: twilio_config.number,
    body: message,
    mediaUrl: mediaUrl
  }, function(err, data) {
    if(err) logger.error(err);
    if(data) logger.debug(data);
  });
}

function mailPhoto(data) {
  logger.info('a user is sending a photo via email');
  var email = new sendgrid.Email();
  if(!data.recipient) {
    recipient = sendgrid_config.default_recipient;
    logger.warn("no recipient passed. mailing photo to default recipient: " + recipient);
  }
  email.addTo(data.recipient);
  email.setFrom(sendgrid_config.from);
  email.setSubject(sendgrid_config.subject);
  email.setText(sendgrid_config.text);
  email.addFile({
    filename: sendgrid_config.filename,
    path: data.filename
  });
  sendgrid.send(email, function(err, json) {
    if (err) return logger.error(err);
    logger.debug(json);
  });
}

function composeS3Url(local_filename) {
  return "http://s3-" + aws_config.region + ".amazonaws.com/" + aws_config.bucket + "/upload/" + local_filename;
}

function textPhoto(data) {
  logger.info('a user is sending a photo via text message');
  if(!data.recipient) { recipient = twilio_config.default_recipient; }
  sendText(data.recipient, twilio_config.message, composeS3Url(data.filename));
}

io.on('connection', function(socket) {
  logger.info('new connection established');
  socket.on('mail photo', mailPhoto);
  socket.on('text photo', textPhoto);
});

fs.watch(__dirname + '/images/', function(event, name) {
  if(event) logger.debug("event: " + event);
  if(name) logger.debug("name: " + name);
  if (name) {
    var filepath = __dirname + '/images/' + name;
  // TODO: uncomment next line on linux machine and delete the line above
  //if (event == "change" && name) {
    fs.readFile(filepath, function(err, file) {
      if(err) logger.error('error reading file: ' + name + '\n' + err);
      else {
        pushToBucket({
          Key: 'upload/images/' + name,
          Body: file,
          ACL: 'public-read',
          ContentType: mime.lookup(filepath),
          ContentLength: file.size
        });
      }
    });
    broadcast_change(name);
  }
});

function broadcast_change(name) {
  io.emit('file changed', { filename: name });
}

app.get('/', function(req, resp) {
  resp.sendFile(__dirname + '/views/index.html');
});
app.use(express.static('views'));
app.use('/assets', express.static('assets'));
app.use('/images', express.static('images'));
app.use('/bower_components', express.static('bower_components'));
app.listen(app.get('port'), function() {
  logger.info("Express server listening on port " + app.get('port'));
});
io.listen(3000);
