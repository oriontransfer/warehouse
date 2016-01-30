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

eval(fs.readFileSync('./public/timer.js', 'utf8'));
eval(fs.readFileSync('./public/container.js', 'utf8'));
eval(fs.readFileSync('./public/state.js', 'utf8'));
eval(fs.readFileSync('./public/assets.js', 'utf8'));
eval(fs.readFileSync('./public/geometry.js', 'utf8'));
eval(fs.readFileSync('./public/maps.js', 'utf8'));

// ** Server Configuration **

Server = {
	physicsRate: 1.0/30.0,
	
	// The refresh rate of the server in FPS.
	updateRate: 1.0/10.0,
	
	message: fs.readFileSync("motd.txt", "utf8"),
	
	maps: ['warehouse']
};

function BlankWorldState () {
	
}

BlankWorldState.prototype.serialize = function() {
	return {};
}

// ** Game State **

function GameController (maps, serverState) {
	this.phase = "reset";
	
	this.serverState = serverState;
	
	this.maps = maps;
	this.mapController = new MapController();
	
	this.currentMapIndex = -1;
	
	this.physicsUpdateTimer = new Timer(function() {
		this.worldState.update(Server.physicsRate);
	}.bind(this), Server.physicsRate * 1000.0);
}

GameController.prototype.serialize = function() {
	var mapName = null;
	
	if (this.mapController.map)
		mapName = this.mapController.map.name;
	
	return {
		map: mapName,
		phase: this.phase,
		worldState: this.worldState.serialize()
	};
}

GameController.prototype.setPhase = function(phase) {
	this.phase = phase;
	console.log("GameController entering phase:", phase);
}

GameController.prototype.update = function(dt) {
	// A simple state machine:
	this[this.phase](dt);
}

GameController.prototype.reset = function(dt) {
	this.timeout = 3.0;
	
	// Select the next map:
	this.currentMapIndex = (this.currentMapIndex + 1) % this.maps.length;
	console.log("Next map:", this.currentMapIndex, this.maps);
	
	this.mapController.loadMap(this.maps[this.currentMapIndex]);
	this.worldState = this.mapController.worldState();
	
	this.sendTimeout();
	
	this.setPhase("preparing");
}

GameController.prototype.sendTimeout = function() {
	this.serverState.users.forEach(function (user) {
		user.emit("timeout", {remaining:this.timeout});
	}.bind(this));
}

GameController.prototype.preparing = function(dt) {
	// Don't start the game unless there is at least one person:
	if (this.serverState.users.length < 1) return;
	
	this.timeout -= dt;

	this.sendTimeout();
	
	if (this.timeout <= 0) {
		this.serverState.sendGlobalMessage("Welcome to " + this.maps[this.currentMapIndex].name);
		
		if (this.serverState.users.length > 1) {
			this.serverState.sendGlobalMessage("There are " + this.serverState.users.length + " players in the game. Who will be first?");
			this.demoMode = false;
		} else {
			this.serverState.sendGlobalMessage("You are alone. Invite your friends to play.");
			this.demoMode = true;
		}
		
		this.serverState.users.forEach(function(user) {
			user.player = this.currentMap.spawn();
			user.player.user = user;
			
			user.emit('spawn', {ID: user.player.ID});
		}.bind(this));
		
		this.worldState.update(dt);
		
		if (this.serverState.users.length > 2)
			this.timeout = 60*5;
		else
			this.timeout = 60;
		
		this.setPhase("running");
		
		this.physicsUpdateTimer.start();
	}
}

GameController.prototype.running = function(dt) {
	this.timeout -= dt;
	var remaining = [];
	
	this.sendTimeout();
	
	this.worldState.players.forEach(function(player) {
		if (player.isAlive) {
			remaining.push(player);
		}
	});
	
	if (!this.demoMode) {
		if (remaining.length == 1) {
			this.serverState.sendGlobalMessage('There can be only one! ' + remaining[0].user.name + ' is the winner!');
		
			this.timeout = 0;
		} else if (remaining.length == 0) {
			this.serverState.sendGlobalMessage('There is no winner...');
		
			this.timeout = 0;
		}
	}
	
	if (this.timeout <= 0 || this.serverState.users == 0) {
		this.setPhase("finishing");
	}
}

GameController.prototype.finishing = function(dt) {
	this.setPhase("reset");
	
	// Disconnect users from player state:
	this.serverState.users.forEach(function(user) {
		delete user.player;
	});
	
	this.physicsUpdateTimer.stop();
}

GameController.prototype.handleEvent = function(user, event, state) {
	if (this.worldState && user.player) {
		//console.log("event", user.player.name, user.player.position, event, state);
		user.player.handleEvent(event, state);
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

function ServerController () {
	this.users = new Container();
	
	this.gameState = new GameController(Server.maps, this);
	
	setInterval(this.updateClients.bind(this), Server.updateRate * 1000);
}

ServerController.prototype.sendGlobalMessage = function(text, html) {
	console.log("Global Message:", text);
	
	this.users.forEach(function(user){
		user.emit('message', {text:text, html:html});
	});
}

ServerController.prototype.sendMessage = function(user, text, html) {
	console.log("User Message:", user.name, text);
	
	user.emit('message', {text:text, html: html});
}

ServerController.prototype.updateClients = function() {
	this.gameState.update(Server.updateRate);
	
	var state = this.gameState.serialize();
	
	this.users.forEach(function(user) {
		user.emit('update', state);
	});
}

ServerController.prototype.addUser = function(name, socket) {
	var assignedName = name, i = 2;
	
	while (this.users.contains(assignedName)) {
		if (i == 2) assignedName = name + " the 2nd";
		else if (i == 3) assignedName = name + " the 3rd";
		else assignedName = name + ' the ' + i + 'th';
		
		i = i + 1;
	}
	
	var user = new UserState(assignedName, socket);
	
	console.log("Adding user", assignedName);
	this.users.push(user);
	
	this.sendMessage(user, "Your name is " + assignedName);
	this.sendMessage(user, Server.message, true);
	
	if (this.gameState.phase == 'running') {
		this.sendMessage(user, "A game is currently in progress with " + Math.floor(this.gameState.timeout) + "s remaining. Please hold on.");
	}
	
	return user;
}

ServerController.prototype.removeUser = function(user) {
	this.users.pop(user);
}

ServerController.prototype.handleEvent = function(user, data) {
	this.gameState.handleEvent(user, data.event, data.state);
}

// ** Connection Code **
SERVER = new ServerController();

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
		
		console.log("Disconnect", user.name);
		
		SERVER.removeUser(user);
	});
	
	socket.on('event', function(data) {
		if (user) {
			console.log("User Event", user.name, data);
		
			SERVER.handleEvent(user, data);
		}
	});
});
