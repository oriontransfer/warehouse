/// *** Class Gamestate ***
/// The state of the gmae map is stored in this Class
function WorldState(tilemap) {
	this.players = new Array();
	this.projectiles = new Array();
	this.playerIDCounter = 0;
	this.protectileIDCounter = 0;
	this.tilemap = tilemap;
}

WorldState.prototype.update = function(dt){

	for(var i = 0, max=players.length; i < max; i++){
		players[i].update(dt);
	}

	for(var i = 0, max=projectiles.length; i < max; i++){
		projectiles[i].update(dt);
	}
}

WorldState.prototype.addPlayer(name, startingLocation){
	var newPlayer = new PlayerState(startingLocation, name, this.playerIDCounter++);
	this.players.push(newPlayer);

	Vec2 tileInside = Vec2(startingLocation[0] / this.tileMap.tileSize[0], startingLocation[1] / this.tileMap.tileSize[1]);
	newPlayer.tileInside = this.tileMap.get(tileInside);
	tileInside.playersInTile.push(newPlayer);
}

WorldState.prototype.addProjectile = function(startingLocation, startingSpeed ,startingDirection){
	var newProjectile = new Protectile(startingLocation, startingSpeed, startingDirection, this.protectileIDCounter++);
	this.projectiles.push(newProjectile);
}

PlayerState.WALKING_SPEED = 10;
PlayerState.RUNNING_SPEED = 20;
PlayerState.Motion = {
	WALKING: 1,
	RUNNING: 2,
	STOPPED: 3,
};
PlayerState.HEALTH = 100;

function PlayerState(initialLocation, name, ID) {
	this.ID = ID;

	//Positional
	this.position = initialLocation;
	this.direction = new Vec2(0, 0);

	//Internal state / control state
	this.motion = Motion.STOPPED;
	this.health = HEALTH;
	this.isMakingNoise  = false;

	this.tileInside = null;
	this.name = name;
}


PlayerState.prototype.setName = function(name) {
	this.name = name;
}

PlayerState.prototype.doDamage(damage){
	this.health -= damage;
}

// PlayerState.prototype.setLocation = function(x, y) {
// 	this.position.x = x;
// 	this.position.y = y;
// }

PlayerState.prototype.setDirection = function(x, y){
	this.direction.x = x;
	this.direction.y = y;
}
/**
* Set the motion state for the player. Refer to PlayerState.Motion for valid states.*
*/
PlayerState.prototype.setMotionState = function(state) {
	this.motion = state;
}

/**
* Function that updates the player state variables.
*/
PlayState.prototype.update = function(dt){
	var locationChange = new Vec2(direction.x, direction.y);

	if(this.motion == Motion.WALKING){
		Vec2.scale(locationChange, dt * WALKING_SPEED);
		Vec2.add(this.position, locationChange);
		this.isMakingNoise = true;
	}
	if(this.motion == Motion.RUNNING){
		Vec2.scale(locationChange, dt * WALKING_SPEED);
		Vec2.add(this.position, locationChange);
		this.isMakingNoise = true;
	}
	if(this.motion == Motion.STOPPED){
		this.isMakingNoise = false;
	}
}

function Protectile(initialPosition, speed, direction, ID) {
	this.ID = ID;
	this.position = initialPosition;
	this.direction = direction;
	this.speed = speed;
}

Protectile.prototype.update = function(dt){
	var locationChange = new Vec2(direction.x, direction.y);

	Vec2.scale(locationChange, dt * speed);
	Vec2.add(this.position, locationChange);
}

