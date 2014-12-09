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
  url = req.url;
  fs.readFile(__dirname + url, function(err, data) {
    if(err) {
      resp.writeHead(500);
      return resp.end("An error occured, please contact your systems administrator.");
    }
    resp.writeHead(200);
    resp.end(data);
  });

}

function sendText(recipient, message, mediaUrl) {
  twilio_client.sendMessage({
    to: recipient,
    from: twilio_config.number,
    body: message + mediaUrl
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
    console.log("length: " + data.filename.split(":").length);
    if(!(data.filename.split(":").length > 1)) { // if filename does not contain a protocol "http://domain.com/file.jpg"
      fs.readFile(__dirname + '/' + data.filename, function(err, file) {
      //fs.readFile(__dirname + '/images/' + data.filename, function(err, file) {
        if(err) console.log('error reading file: ' + data.filename);
        else {
          pushToBucket({
            Key: 'upload/' + data.filename,
            Body: file,
            ACL: 'public-read'
          });
          var aws_url = "http://s3-" + aws_config.region + ".amazonaws.com/" + aws_config.bucket + "/upload/" + data.filename;
          console.log(aws_url);
          sendText(twilio_config.default_recipient,
                  "Grab your photo now, before it's gone: ",
                  aws_url
          );
        }
      });
    } else {
      console.log("Error: Not a local file. Aborting...");
    }
  });
});

fs.watch(__dirname + '/images/', function(event, name) {
  if(event) console.log("event: " + event);
  if(name) console.log("name: " + name);
  if (name) {
  // TODO: uncomment next line on linux machine and delete the line above
  //if (event == "change" && name) {
    broadcast_change(name);
  }
});

function broadcast_change(name) {
  io.emit('file changed', { filename: name });
}

app.listen(3000);
