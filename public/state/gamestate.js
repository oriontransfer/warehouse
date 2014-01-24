/// *** Class Gamestate ***
/// The state of the gmae map is stored in this Class
function WorldState() {
	this.players = new Array();
}

WorldState.prototype.update = function(dt){
	for(var i = 0, max=players.length; i < max; i++){
		players[i].update(dt);
	}

}

PlayerState.WALKING_SPEED = 10;
PlayerState.RUNNING_SPEED = 20;
PlayerState.Motion = {
	WALKING: 1,
	RUNNING: 2,
	STOPPED: 3,
};

function PlayerState() {
	this.ID = '';
	this.position = new Vec2(0, 0);
	this.direction = new Vec2(0, 0);
	this.motion = Motion.STOPPED;

	this.name = "new player";
}


PlayerState.prototype.setName = function(name) {
	this.name = name;
}

// PlayerState.prototype.setLocation = function(x, y) {
// 	this.position.x = x;
// 	this.position.y = y;
// }

PlayerState.prototype.setDirection = function(x, y){
	this.direction.x = x;
	this.direction.y = y;
}

PlayState.prototype.update = function(dt){
	var locationChange = new Vec2(direction.x, direction.y);

	if(this.motion == Motion.WALKING){
		Vec2.scale(locationChange, dt * WALKING_SPEED);
		Vec2.add(this.position, locationChange);
	}
}

