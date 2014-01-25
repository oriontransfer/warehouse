/// *** Class Gamestate ***
/// The state of the gmae map is stored in this Class
function WorldState() {
	this.players = new Container();
	this.projectiles = new Container();
	this.geometry = new Container();
	
	this.playerIDCounter = 0;
	this.protectileIDCounter = 0;
	// if(tilemap){
	// 	this.tilemap = tilemap;
	// }
	this.initPhysics();	
	this.world;
	
}


//Const world variables
WorldState.PLAYER_SIZE_HALF = 0.4;
WorldState.PLAYER_MASS = 20;

WorldState.PROJECTILE_SIZE_HALF = 0.05;
WorldState.PROJECTILE_MASS = 0;


WorldState.prototype.initPhysics = function(){

	//Initialise the world
	this.world = new CANNON.World();
	var world = this.world;

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
	world.addContactMaterial(this.groundPhysicsContactMaterial);

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

WorldState.addBoxGeometry = function(locationVEC3, halfExtentsVEC3){

}

WorldState.addPlaneGeometry = function(locationVEC3, directionVEC3){

}

WorldState.prototype.addPlayer = function(name, startingLocationVEC2){
	var newPlayer = new PlayerState(startingLocationVEC2, name, this.playerIDCounter++);
	this.players.add(newPlayer.name, newPlayer);

	// var tileInside = new Vec2(startingLocationVEC2[0] / this.tileMap.tileSize[0], startingLocationVEC2[1] / this.tileMap.tileSize[1]);
	// newPlayer.tileInside = this.tileMap.get(tileInside);
	// tileInside.playersInTile.push(newPlayer);

	//Create box shape and add it to the world.
	var boxHalfExtents = new CANNON.Vec3(WorldState.PLAYER_SIZE_HALF, WorldState.PLAYER_SIZE_HALF, WorldState.PLAYER_SIZE_HALF);
	var boxShape = new CANNON.Box(boxHalfExtents);
	var boxBody = new CANNON.RigidBody(WorldState.PLAYER_MASS, boxShape, this.boxPhysicsMaterial);
	if(startingLocationVEC2){
		boxBody.position.set(startingLocationVEC2[0], WorldState.PLAYER_SIZE_HALF + 0.1, startingLocationVEC2[2]); //Uses X and Z coords to place player and should place player steadily on hte ground.
	}
	else{
		boxBody.position.set(0, WorldState.PLAYER_SIZE_HALF + 0.1, 0);
	}
	//Store references to each other for call backs.
	boxBody.userData = newPlayer;
	newPlayer.boxBody = boxBody;

	this.world.add(boxBody);

	return newPlayer;
}

//Starting location and direction is a Vec3
WorldState.prototype.addProjectile = function(startingLocation, startingSpeed ,startingDirection){
	var newProjectile = new Protectile(startingLocation, startingSpeed, startingDirection, this.protectileIDCounter++);
	this.projectiles.add(newProjectile.ID, newProjectile);

	projShape = new CANNON.Sphere(PROJECTILE_SIZE_HALF);
	projBody = new CANNON.RigidBody(PROJECTILE_MASS, projShape, boxPhysicsMaterial);
	projBody.position.set(startingLocation[0], startingLocation[1], startingLocation[2]);

	//Get the direciton of the projectile, mult by speed and set that as the initial velocity of the projectile.
	var initVelocity = new CANNON.Vec3(0,0,0);
	startingDirection.copy(initVelocity);
	initVelocity.mult(startingSpeed);
	projBody.initVelocity = initVelocity;

	projBody.userData = newProjectile;
	newProjectile.projBody = projBody;

	world.add(projBody);

}

function PlayerState(initialLocation, name, ID) {
	this.ID = ID;

	//Positional
	this.position = null;
	this.direction = new CANNON.Vec3(0, 0, 0);
	this.rotationQuat = null;

	//Internal state / control state
	this.motion = PlayerState.Motion.STOPPED;
	this.motionDirection = PlayerState.Direction.FORWARD;
	this.rotation = PlayerState.Motion.STOPPED;
	this.rotationDirection = PlayerState.Direction.LEFT;
	this.health = PlayerState.HEALTH;
	this.isMakingNoise  = false;

	this.tileInside = null;
	this.name = name;

	this.boxBody; //The box has some sexy body.
}

//Const player variables.
PlayerState.WALKING_SPEED = 0.1;
PlayerState.RUNNING_SPEED = 0.2;
PlayerState.WALKING_ROT_SPEED = 0.1;
PlayerState.RUNNING_ROT_SPEED = 0.05;
PlayerState.MAX_WALKING_SPEED = 0.8;
PlayerState.MAX_RUNNING_SPEED = 0.8;
PlayerState.Motion = {
	WALKING: 1,
	RUNNING: 2,
	STOPPED: 3,
};
PlayerState.Direction = {
	FORWARD: 1,
	BACKWARD: 2,
	LEFT: 3,
	RIGHT: 4,
}
PlayerState.HEALTH = 100;


PlayerState.prototype.setName = function(name) {
	this.name = name;
}

PlayerState.prototype.doDamage = function(damage){
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
PlayerState.prototype.setMotionState = function(state, direction) {
	this.motion = state;
	this.motionDirection = direction;
}

PlayerState.prototype.setRotationState = function(state, direction) {
	this.rotation = state;
	this.rotationDirection = direction;
}

/**
* Function that updates the player state variables.
*/
PlayerState.ORIGIN = new CANNON.Vec3(0,0,0); //constant used for distance calculations

PlayerState.prototype.update = function(dt){
	this.position = this.boxBody.position;
	this.rotationQuat = this.boxBody.quaternion;

	if(this.motion == PlayerState.Motion.WALKING && this.boxBody.velocity.distanceTo(origin) < WALKING_SPEED){
		var impulseDirection = new CANNON.Vec3(0,0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(WALKING_SPEED, impulseDirection);
	}
	if(this.motion == PlayerState.Motion.RUNNING && this.boxBody.velocity.distanceTo(origin) < RUNNING_SPEED){
		var impulseDirection = new CANNON.Vec3(0,0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(RUNNING_SPEED, impulseDirection);
	}

	if(this.rotation == PlayerState.Motion.WALKING && this.boxBody.velocity.distanceTo(origin) < WALKING_SPEED){
		var impulseDirection = new CANNON.Vec3(0,0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(WALKING_SPEED, impulseDirection);
	}
	if(this.rotation == PlayerState.Motion.RUNNING && this.boxBody.velocity.distanceTo(origin) < RUNNING_SPEED){
		var impulseDirection = new CANNON.Vec3(0,0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(RUNNING_SPEED, impulseDirection);
	}

	if(this.motion == PlayerState.Motion.STOPPED && this.rotation == Motion.STOPPED){
		this.isMakingNoise = false;
	}
	else this.isMakingNoise = true;

}

function Protectile(speed, direction, ID) {
	this.ID = ID;

	//Positional
	this.position = null;
	this.direction = new CANNON.Vec3(0, 0, 0);
	this.rotationQuat = null;
	this.speed = speed;

	this.projBody = null;
}

Protectile.ORIGIN = new CANNON.Vec3(0,0,0); //constant used for distance calculations

Protectile.prototype.update = function(dt){
	this.position = this.projBody.position;
	this.rotationQuat = this.projBody.quaternion;

	this.speed = this.projBody.velocity.distanceTo(ORIGIN);
}

function GeometryState(shader){
	this.position = null;
	this.rotationQuat = null;

	this.RigidBody = null;

		this.shader = "";
}

GeometryState.prototype.update = function(dt){
	this.position = this.boxBody.position;
	this.rotationQuat = this.boxBody.quaternion;
}
