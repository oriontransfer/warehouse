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

var CANNON = require('cannon');

eval(fs.readFileSync('./public/container.js', 'utf8'));
eval(fs.readFileSync('./public/worldstate.js', 'utf8'));

// ** Game Map **

//function GameMap (size) {
//	this.size = size;
//	this.spawn
//}

function BlankWorldState () {
	
}

BlankWorldState.prototype.serialize = function() {
	return {};
}

// ** Game State **

function GameState (serverState) {
	this.phase = "reset";
	
	this.serverState = serverState;
	
	this.worldState = new BlankWorldState();
}

GameState.prototype.serialize = function() {
	return {
		phase: this.phase,
		worldState: this.worldState.serialize()
	};
}

GameState.prototype.setPhase = function(phase) {
	this.phase = phase;
	console.log("GameState entering phase", phase);
}

GameState.prototype.update = function(dt) {
	// A simple state machine:
	this[this.phase](dt);
}

GameState.prototype.reset = function(dt) {
	this.worldState = new WorldState();
	this.timeout = 5.0;
	
	this.setPhase("preparing");
}

GameState.prototype.preparing = function(dt) {
	this.timeout -= dt;
	
	if (this.timeout <= 0) {
		var y = 1;
		
		this.serverState.users.forEach(function(user) {
			this.worldState.addPlayer(user.name, new CANNON.Vec3(5, y * 5, 10));
			
			y += 1; 
		});
		
		this.timeout = 60;
		this.setPhase("running");
	}
}

GameState.prototype.running = function(dt) {
	this.worldState.update(dt);
	
	this.timeout -= dt;
	
	if (this.timeout <= 0) {
		this.setPhase("finishing");
	}
}

GameState.prototype.finishing = function(dt) {
	this.setPhase("reset");
}

// ** User State **
function UserState (name, socket) {
	this.name = name;
	this.score = 0;
	
	this.socket = socket;
}

UserState.prototype.ID = function() {
	return this.name;
}

// ** Server State **
Server = {
	// The refresh rate of the server in FPS.
	updateRate: 1.0/10.0
};

function ServerState () {
	this.users = new Container();
	
	this.gameState = new GameState(this);
	
	setInterval(this.updateClients.bind(this), Server.updateRate * 1000);
}

ServerState.prototype.updateClients = function() {
	this.gameState.update(Server.updateRate);
	
	var state = this.gameState.serialize();
	
	this.users.forEach(function(user) {
		user.emit('state', state);
	});
}

ServerState.prototype.addUser = function(name, socket) {
	var assignedName = name, i = 4;
	
	while (this.users.contains(assignedName)) {
		if (i == 2) assignedName = name + " the 2nd";
		else if (i == 3) assignedName = name + " the 3rd";
		assignedName = name + ' the ' + i + 'th';
	}
	
	this.users.push(new UserState(name), socket);
}

ServerState.prototype.removeUser = function(user) {
	this.users.pop(user);
}

// ** Connection Code **
SERVER = new ServerState();

io.sockets.on('connection', function (socket) {
	var user = null;
	
	socket.on('register', function(data) {
		console.log("Register", data);
		user = SERVER.addUser(data.name, socket);
	});
	
	socket.on('disconnect', function () {
		console.log("Disconnect", user);
		SERVER.removeUser(user);
	});
	
	socket.on('event', function(data) {
		console.log("User Event", user, event);
		
		SERVER.handleEvent(user, event);
	});
});
