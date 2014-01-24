// Server Setup
var express = require('express');
var http = require('http');
var fs = require('fs');
var socketio = require('socket.io');

var app = express();

var server = http.createServer(app);
server.listen(8000);

// Server Code
app.use(express.static(__dirname + '/public'));

var io = socketio.listen(server);

io.sockets.on('connection', function (socket) {
	socket.on('handleEvent', function(data) {
		console.log(data);
		
		socket.emit("eventHandled");
	});
	
	setInterval(function() {
		socket.emit('news', { time: new Date() + '' });
	}, 1000);
});
