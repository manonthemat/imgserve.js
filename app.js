var app = require('http').createServer(handler);
var io = require('socket.io')(app);
var fs = require('fs');

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

io.on('connection', function(socket) {
  console.log('new connection established');
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
