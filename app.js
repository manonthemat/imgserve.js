var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');
var env = process.env.NODE_ENV || 'development';
var twilio_config = require(__dirname + '/config/twilio.js')[env];
var twilio_client = require('twilio')(twilio_config.accountSid, twilio_config.authToken);

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
