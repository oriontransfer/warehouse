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
		}.bind(this));
		
		this.worldState.update(dt);
		
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

GameState.prototype.handleEvent = function(user, event, state) {
	if (this.worldState) {
		var player = this.worldState.players.values[user.ID];
		
		if (player) {
			console.log("event", player.name, player.position, event, state);
			player.handleEvent(event, state);
		}
	}
}

// ** User State **
function UserState (name, socket) {
	this.ID = name;
	
	this.name = name;
	this.score = 0;
	
	this.socket = socket;
}

UserState.prototype.emit = function(name, data) {
	this.socket.emit(name, data);
}

// ** Server State **
Server = {
	// The refresh rate of the server in FPS.
	updateRate: 1.0/5.0
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
		user.emit('update', state);
	});
}

ServerState.prototype.addUser = function(name, socket) {
	var assignedName = name, i = 2;
	
	while (this.users.contains(assignedName)) {
		if (i == 2) assignedName = name + " the 2nd";
		else if (i == 3) assignedName = name + " the 3rd";
		else assignedName = name + ' the ' + i + 'th';
	}
	
	var user = new UserState(assignedName, socket);
	
	console.log("Adding user", assignedName);
	this.users.push(user);
	
	return user;
}

ServerState.prototype.removeUser = function(user) {
	this.users.pop(user);
}

ServerState.prototype.handleEvent = function(user, data) {
	this.gameState.handleEvent(user, data.event, data.state);
}

// ** Connection Code **
SERVER = new ServerState();

// Less logging output:
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
	var user = null;
	
	socket.on('register', function(data) {
		user = SERVER.addUser(data.name, socket);
	});
	
	socket.on('disconnect', function () {
		// Unregistered user:
		if (user == null) return;
		
		console.log("Disconnect", user);
		
		SERVER.removeUser(user);
	});
	
	socket.on('event', function(data) {
		if (user) {
			console.log("User Event", user.name, data);
		
			SERVER.handleEvent(user, data);
		}
	});
});
