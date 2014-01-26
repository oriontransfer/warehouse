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
eval(fs.readFileSync('./public/worldstate.js', 'utf8'));
eval(fs.readFileSync('./public/assets.js', 'utf8'));
eval(fs.readFileSync('./public/maps.js', 'utf8'));

// ** Server Configuration **

// ** Server State **
Server = {
	physicsRate: 1.0/30.0,
	
	// The refresh rate of the server in FPS.
	updateRate: 1.0/8.0,
};

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

function GameState (maps, serverState) {
	this.phase = "reset";
	
	this.serverState = serverState;
	
	this.worldState = new BlankWorldState();
	
	this.maps = maps;
	
	this.currentMapIndex = -1;
	
	this.physicsUpdateTimer = new Timer(function() {
		this.worldState.update(Server.physicsRate);
	}.bind(this), Server.physicsRate * 1000.0);
}

GameState.prototype.serialize = function() {
	return {
		map: this.currentMapIndex,
		phase: this.phase,
		worldState: this.worldState.serialize()
	};
}

GameState.prototype.setPhase = function(phase) {
	this.phase = phase;
	console.log("GameState entering phase:", phase);
}

GameState.prototype.update = function(dt) {
	// A simple state machine:
	this[this.phase](dt);
}

GameState.prototype.reset = function(dt) {
	this.worldState = new WorldState();
	this.timeout = 3.0;
	
	// Select the next map:
	this.currentMapIndex = (this.currentMapIndex + 1) % this.maps.length;
	console.log("Next map:", this.currentMapIndex, this.maps);
	
	this.currentMap = this.maps[this.currentMapIndex].create(this.worldState);
	
	this.sendTimeout();
	
	this.setPhase("preparing");
}

GameState.prototype.sendTimeout = function() {
	this.serverState.users.forEach(function (user) {
		user.emit("timeout", {remaining:this.timeout});
	}.bind(this));
}

GameState.prototype.preparing = function(dt) {
	// Don't start the game unless there is at least one person:
	if (this.serverState.users.length < 1) return;
	
	this.timeout -= dt;

	this.sendTimeout();
	
	if (this.timeout <= 0) {
		this.serverState.sendGlobalMessage("Welcome to " + this.maps[this.currentMapIndex].name);
		
		if (this.serverState.users.length > 1) {
			this.serverState.sendGlobalMessage("There are " + this.serverState.users.length + " players in the game. Who will be first?");
			this.demoMOde = false;
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
		
		if(this.serverState.users.length > 2)this.timeout = 60*5;
		else this.timeout = 60;
		this.setPhase("running");
		
		this.physicsUpdateTimer.start();
	}
}

GameState.prototype.running = function(dt) {
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

GameState.prototype.finishing = function(dt) {
	this.setPhase("reset");
	
	// Disconnect users from player state:
	this.serverState.users.forEach(function(user) {
		delete user.player;
	});
	
	this.physicsUpdateTimer.stop();
}

GameState.prototype.handleEvent = function(user, event, state) {
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

function ServerState () {
	this.users = new Container();
	
	this.gameState = new GameState(AngryBoxMaps, this);
	
	setInterval(this.updateClients.bind(this), Server.updateRate * 1000);
}

ServerState.prototype.sendGlobalMessage = function(text) {
	console.log("Global Message:", text);
	
	this.users.forEach(function(user){
		user.emit('message', {text:text});
	});
}

ServerState.prototype.sendMessage = function(user, text) {
	console.log("User Message:", user.name, text);
	
	user.emit('message', {text:text});
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
	
	this.sendMessage(user, "Your name is " + assignedName);
	
	if (this.gameState.phase == 'running') {
		this.sendMessage(user, "A game is currently in progress with " + Math.floor(this.gameState.timeout) + "s remaining. Please hold on.");
	}
	
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
			//console.log("User Event", user.name, data);
		
			SERVER.handleEvent(user, data);
		}
	});
});
