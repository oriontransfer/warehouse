/// *** Class Gamestate ***
/// The state of the gmae map is stored in this Class
function WorldState(tilemap) {
	this.players = new Array();
	this.projectiles = new Array();
	this.playerIDCounter = 0;
	this.protectileIDCounter = 0;
	this.tilemap = tilemap;

	initPhysics();	
}


//Const world variables
WorldState.PLAYER_SIZE_HALF = 0.4;
WorldState.PLAYER_MASS = 20;

WorldState.prototype.initPhysics(){

	//Initialise the world
	World = new CANNON.World();

	var solver = new CANNON.GSSolver();

	world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRegularizationTime = 4;

    solver.iterations = 7;
    solver.tolerance = 0.1;

    world.solver = solver;

    world.gravity.set(0,-20, 0);

	world.broadphase = new CANNON.NaiveBroadphase();

	//Initialise the physics contact materials.
	var boxPhysicsMaterial = new CANNON.ContactMaterial("BOX_PHY_MATERIAL");
	this.boxPhysicsContactMaterial = new CANNON.ContactMaterial(boxPhysicsMaterial,
																boxPhysicsMaterial,
																0.0,
																0.3);

	var groundPhysicsMaterial = new CANNON.ContactMaterial("GROUND_PHY_MATERIAL");
	this.groundPhysicsContactMaterial = new CANNON.ContactMaterial(groundPhysicsMaterial,
																groundPhysicsMaterial,
																0.0,
																0.3);

	world.addContactMaterial(this.boxPhysicsContactMaterial);
	world.addContactMaterial(this.groundPhysicsMaterial);

	//Initialise the ground plane
	var groundShape = new CANNON.Plane();
	var groundBody = new CANNON.RigidBody(0, groundShape, this.groundPhysicsMaterial);
	groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
	world.add(groundBody);
}

WorldState.prototype.update = function(dt){

	this.world.step(dt);

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

	//Create box shape and add it to the world.
	var boxHalfExtents = new CANNON.Vec3(PLAYER_SIZE_HALF, PLAYER_SIZE_HALF, PLAYER_SIZE_HALF);
	boxShape = new CANNON.boxShape(boxHalfExtents);
	boxBody = new CANNON.RigidBody(PLAYER_MASS, boxShape, this.boxPhysicsMaterial);
	boxBody.position.set(startingLocation[0], PLAYER_SIZE_HALF + 0.1, startingLocation[2]); //Uses X and Z coords to place player and should place player steadily on hte ground.

	//Store references to each other for call backs.
	boxBody.userData = newPlayer;
	nerPlayer.boxBody = boxBody;

	world.add(boxBody);
}

WorldState.prototype.addProjectile = function(startingLocation, startingSpeed ,startingDirection){
	var newProjectile = new Protectile(startingLocation, startingSpeed, startingDirection, this.protectileIDCounter++);
	this.projectiles.push(newProjectile);
}

//Const player variables.
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
	this.position = null;
	this.direction = new Vec3(0, 0, 0);

	//Internal state / control state
	this.motion = Motion.STOPPED;
	this.health = HEALTH;
	this.isMakingNoise  = false;

	this.tileInside = null;
	this.name = name;

	this.boxBody; //The box has some sexy body.
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
	this.direction.z = y;
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
	this.position = this.boxBody.position;

	if(this.motion == Motion.WALKING){
		Vec3 impulseDirection = new Vec3(0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(WALKING_SPEED, impulseDirection);
		this.isMakingNoise = true;
	}
	if(this.motion == Motion.RUNNING){
		Vec3 impulseDirection = new Vec3(0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(RUNNING_SPEED, impulseDirection);
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
	// var locationChange = new Vec2(direction.x, direction.y);

	// Vec2.scale(locationChange, dt * speed);
	// Vec2.add(this.position, locationChange);
}

