/// *** Class Gamestate ***
/// The state of the gmae map is stored in this Class
function WorldState(tilemap) {
	this.players = new Array();
	this.projectiles = new Array();
	this.playerIDCounter = 0;
	this.protectileIDCounter = 0;
	if(tilemap){}
		this.tilemap = tilemap;
	}
	initPhysics();	
	
}


//Const world variables
WorldState.PLAYER_SIZE_HALF = 0.4;
WorldState.PLAYER_MASS = 20;

WorldState.PROJECTILE_SIZE_HALF = 0.05;
WorldState.PROJECTILE_MASS = 0;


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

	return newPlayer;
}

//Starting location and direction is a Vec3
WorldState.prototype.addProjectile = function(startingLocation, startingSpeed ,startingDirection){
	var newProjectile = new Protectile(startingLocation, startingSpeed, startingDirection, this.protectileIDCounter++);
	this.projectiles.push(newProjectile);

	projShape = new CANNON.Sphere(PROJECTILE_SIZE_HALF);
	projBody = new CANNON.RigidBody(PROJECTILE_MASS, projShape, boxPhysicsMaterial);
	projBody.position.set(startingLocation[0], startingLocation[1], startingLocation[2]);

	//Get the direciton of the projectile, mult by speed and set that as the initial velocity of the projectile.
	var Vec3 initVelocity = new Vec3(0,0,0);
	startingDirection.copy(initVelocity);
	initVelocity.mult(startingSpeed);
	projBody.initVelocity = initVelocity;

	projBody.userData = newProjectile;
	newProjectile.projBody = projBody;

	world.add(projBody);

}

//Const player variables.
PlayerState.WALKING_SPEED = 0.1;
PlayerState.RUNNING_SPEED = 0.2;
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

function PlayerState(initialLocation, name, ID) {
	this.ID = ID;

	//Positional
	this.position = null;
	this.direction = new Vec3(0, 0, 0);
	this.rotationQuat = null;

	//Internal state / control state
	this.motion = Motion.STOPPED;
	this.motionDirection = Direction.FORWARD;
	this.rotation = Motion.STOPPED;
	this.rotationDirection = Direction.LEFT;
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
PlayerState.ORIGIN = new Vec3(0,0,0); //constant used for distance calculations

PlayState.prototype.update = function(dt){
	this.position = this.boxBody.position;
	this.rotationQuat = this.boxBody.quaternion;

	if(this.motion == Motion.WALKING && this.boxBody.velocity.distanceTo(origin) < WALKING_SPEED){
		Vec3 impulseDirection = new Vec3(0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(WALKING_SPEED, impulseDirection);
	}
	if(this.motion == Motion.RUNNING && this.boxBody.velocity.distanceTo(origin) < RUNNING_SPEED){
		Vec3 impulseDirection = new Vec3(0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(RUNNING_SPEED, impulseDirection);
	}

	if(this.rotation == Motion.WALKING && this.boxBody.velocity.distanceTo(origin) < WALKING_SPEED){
		Vec3 impulseDirection = new Vec3(0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(WALKING_SPEED, impulseDirection);
	}
	if(this.rotation == Motion.RUNNING && this.boxBody.velocity.distanceTo(origin) < RUNNING_SPEED){
		Vec3 impulseDirection = new Vec3(0,0);
		this.position.copy(impulseDirection);

		impulseDirection.vsub(this.direction);

		this.boxBody.applyForce(RUNNING_SPEED, impulseDirection);
	}

	if(this.motion == Motion.STOPPED && this.rotation == Motion.STOPPED){
		this.isMakingNoise = false;
	}
	else this.isMakingNoise = true;

}

function Protectile(speed, direction, ID) {
	this.ID = ID;

	//Positional
	this.position = null;
	this.direction = new Vec3(0, 0, 0);
	this.rotationQuat = null;
	this.speed = speed;

	this.projBody = null;
}

Protectile.ORIGIN = new Vec3(0,0,0); //constant used for distance calculations

Protectile.prototype.update = function(dt){
	this.position = this.projBody.position;
	this.rotationQuat = this.projBody.quaternion;

	this.speed = this.projBody.velocity.distanceTo(ORIGIN);
}

