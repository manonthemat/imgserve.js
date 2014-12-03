var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
var env = process.env.NODE_ENV || 'development';
var aws_config = require(__dirname + '/config/aws.js')[env];
var twilio_config = require(__dirname + '/config/twilio.js')[env];
var twilio_client = require('twilio')(twilio_config.accountSid, twilio_config.authToken);

var AWS = require('aws-sdk');
AWS.config.accessKeyId = aws_config.AWS_ACCESS_KEY_ID;
AWS.config.secretAccessKey = aws_config.AWS_SECRET_ACCESS_KEY;
AWS.config.region = aws_config.region;

var s3bucket = new AWS.S3({params: {Bucket: aws_config.bucket}});

function pushToBucket(data) {
  s3bucket.putObject(data, function(err, data) {
    if(err) console.log("An error occured while trying to push to S3 bucket\n", err);
    else console.log("push to s3 successful");
  });
}

function handler(req, resp) {
  var url;
  if(req.url.split('/')[1] == 'images') {
    url = req.url;
  } else {
    url = '/views/index.html';
  }
  fs.readFile(__dirname + url, function(err, data) {
    if(err) {
      resp.writeHead(500);
      return resp.end("An error occured, please contact your systems administrator.");
    }
    resp.writeHead(200);
    resp.end(data);
  });

}

function sendText(recipient, message) {
  twilio_client.sendMessage({
    to: recipient,
    from: twilio_config.number,
    body: message
  }, function(err, data) {
    if(err) console.log(err);
    if(data) console.log(data);
  });
}

io.on('connection', function(socket) {
  console.log('new connection established');
  socket.on('share image', function(data) {
    console.log('a user wants to share an image');
    console.log(data);
    pushToBucket({Key: data.filename, Body: data.filename});
    sendText(twilio_config.default_recipient, "Your love life will be... interesting.");
  });
});

fs.watch(__dirname + '/images/', function(event, name) {
  if(event) console.log("event: " + event);
  if(name) console.log("name: " + name);
  if (event == "change" && name) {
    broadcast_change(name);
  }
});

function broadcast_change(name) {
  io.emit('file changed', { filename: name });
}

app.listen(3000);
