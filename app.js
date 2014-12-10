var express = require('express');
var app = express();
app.set('port', process.env.PORT || 8000);
var io = require('socket.io')(require('http').Server(app));
var fs = require('fs');

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

function pushToBucket(data) {
  s3bucket.putObject(data, function(err, data) {
    if(err) console.error("An error occured while trying to push to S3 bucket\n", err);
    else console.log("push to s3 successful");
  });
}

function sendText(recipient, message, mediaUrl) {
  console.log("mediaUrl in sendText: " + mediaUrl);
  twilio_client.sendMessage({
    to: recipient,
    from: twilio_config.number,
    body: message + mediaUrl,
    mediaUrl: mediaUrl // doesn't like our S3 urls for some reason yet
  }, function(err, data) {
    if(err) console.error(err);
    if(data) console.log(data);
  });
}

function mailPhoto(data, recipient) {
  console.log('a user is sending a photo via email');
  console.log('data.filename in mailPhoto: ' + data.filename);
  var email = new sendgrid.Email();
  if(!recipient) {
    console.error("no recipient passed. mailing photo to matthias@virsix.com");
    recipient = "matthias@virsix.com";
  }
  email.addTo(recipient);
  email.setFrom(sendgrid_config.from);
  email.setSubject(sendgrid_config.subject);
  email.setText(sendgrid_config.text);
  email.addFile({
    filename: sendgrid_config.filename,
    path: data.filename
  });
  sendgrid.send(email, function(err, json) {
    if (err) return console.error(err);
    console.log(json);
  });
}

function composeS3Url(local_filename) {
  return "http://s3-" + aws_config.region + ".amazonaws.com/" + aws_config.bucket + "/upload/" + local_filename;
}

function textPhoto(data) {
  console.log('a user is sending a photo via text message');
  sendText(twilio_config.default_recipient,
          "Grab your photo now, before it's gone: ",
          composeS3Url(data.filename)
  );
}

io.on('connection', function(socket) {
  console.log('new connection established');
  socket.on('mail photo', mailPhoto);
  socket.on('text photo', textPhoto);
});

fs.watch(__dirname + '/images/', function(event, name) {
  if(event) console.log("event: " + event);
  if(name) console.log("name: " + name);
  if (name) {
  // TODO: uncomment next line on linux machine and delete the line above
  //if (event == "change" && name) {
    fs.readFile(__dirname + '/images/' + name, function(err, file) {
      if(err) console.error('error reading file: ' + name + '\n' + err);
      else {
        pushToBucket({
          Key: 'upload/images/' + name,
          Body: file,
          ACL: 'public-read'
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
app.use('/images', express.static('images'));
app.use('/bower_components', express.static('bower_components'));
app.listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});
io.listen(3000);
