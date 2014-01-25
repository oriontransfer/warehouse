/// *** Class Gamestate ***
/// The state of the gmae map is stored in this Class
function WorldState() {
	this.players = new Container();
	this.projectiles = new Container();
	this.geometry = new Container();
	
	this.obstructions = new Container();
	
	this.playerIDCounter = 0;
	this.protectileIDCounter = 0;
	this.geometryIDCounter = 0;
	// if(tilemap){
	// 	this.tilemap = tilemap;
	// }
	this.initPhysics();	
	this.world;
	
}


//Const world variables
WorldState.PLAYER_SIZE_HALF = 0.8;
WorldState.PLAYER_MASS = 2515 * 0.5;
WorldState.ANGULAR_DAMPING = 0.99;

WorldState.PROJECTILE_SIZE_HALF = 0.05;
WorldState.PROJECTILE_MASS = 0;


WorldState.prototype.initPhysics = function(){

	//Initialise the world
	this.world = new CANNON.World();
	this.world.broadphase = new CANNON.NaiveBroadphase();
	world = this.world;

	solver = new CANNON.GSSolver();

	// world.defaultContactMaterial.contactEquationStiffness = 1e8;
 //    world.defaultContactMaterial.contactEquationRegularizationTime = 3;

    solver.iterations = 20;
    solver.tolerance = 0;

    world.solver = solver;

    world.gravity.set(0, 0, -9.8);

	

	//Initialise the physics contact materials.
	this.boxPhysicsMaterial = new CANNON.Material("BOX_PHY_MATERIAL");
	// this.boxPhysicsContactMaterial = new CANNON.ContactMaterial(this.boxPhysicsMaterial,
	// 															this.boxPhysicsMaterial,
	// 															0,
	// 															0);

	

	this.groundPhysicsMaterial = new CANNON.Material("GROUND_PHY_MATERIAL");
	this.groundPhysicsContactMaterial = new CANNON.ContactMaterial(this.groundPhysicsMaterial,
																this.boxPhysicsMaterial,
																0.001,
																0.3);

	// this.boxPhysicsContactMaterial.frictionEquationStiffness = 1e8;
	// this.boxPhysicsContactMaterial.frictionEquationRegularizationTime = 3;

	// // Adjust constraint equation parameters
 //    this.boxPhysicsContactMaterial.contactEquationStiffness = 1e8;
 //    this.boxPhysicsContactMaterial.contactEquationRegularizationTime = 3;

	// Adjust constraint equation parameters
   	this.groundPhysicsContactMaterial.contactEquationStiffness = 1e8;
    this.groundPhysicsContactMaterial.contactEquationRegularizationTime = 3;

    this.groundPhysicsContactMaterial.frictionEquationStiffness = 1e8;
	this.groundPhysicsContactMaterial.frictionEquationRegularizationTime = 3;

	//orld.addContactMaterial(this.boxPhysicsContactMaterial);
	world.addContactMaterial(this.groundPhysicsContactMaterial);

	//Initialise the ground plane
	var groundShape = new CANNON.Plane();
	var groundBody = new CANNON.RigidBody(0, groundShape, this.groundPhysicsMaterial);
	groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0,0,1),-Math.PI/2);
	world.add(groundBody);
}

WorldState.prototype.update = function(dt){

	this.world.step(dt);

	this.players.forEach(function(player){
		player.update(dt);
	});

	this.projectiles.forEach(function(projectile){
		projectile.update(dt);
	});
}

WorldState.addBoxGeometry = function(locationVEC3, halfExtentsVEC3, shader){
	var newGeometry = new GeometryState(shader, this.geometryIDCounter++);
	this.geometry.add(newGeometry);

	// var tileInside = new Vec2(startingLocationVEC2[0] / this.tileMap.tileSize[0], startingLocationVEC2[1] / this.tileMap.tileSize[1]);
	// newPlayer.tileInside = this.tileMap.get(tileInside);
	// tileInside.playersInTile.push(newPlayer);

	//Create box shape and add it to the world.
	var boxShape = new CANNON.Box(halfExtentsVEC3);
	var boxBody = new CANNON.RigidBody(WorldState.PLAYER_MASS, boxShape, this.boxPhysicsMaterial);

	boxBody.position = locationVEC3;
	//Store references to each other for call backs.
	boxBody.userData = newGeometry;
	newGeometry.RigidBody = boxBody;

	this.world.add(boxBody);

	return newGeometry;
}


WorldState.prototype.addPlayer = function(name, startingLocationVEC3){
	var newPlayer = new PlayerState(name, this.playerIDCounter++);
	// var tileInside = new Vec2(startingLocationVEC2[0] / this.tileMap.tileSize[0], startingLocationVEC2[1] / this.tileMap.tileSize[1]);
	// newPlayer.tileInside = this.tileMap.get(tileInside);
	// tileInside.playersInTile.push(newPlayer);

	//Create box shape and add it to the world.
	var boxHalfExtents = new CANNON.Vec3(WorldState.PLAYER_SIZE_HALF, WorldState.PLAYER_SIZE_HALF, WorldState.PLAYER_SIZE_HALF);
	var boxShape = new CANNON.Box(boxHalfExtents);
	var boxBody = new CANNON.RigidBody(WorldState.PLAYER_MASS, boxShape, this.boxPhysicsMaterial);

	boxBody.angularDamping = WorldState.ANGULAR_DAMPING;
	//boxBody.material = this.boxPhysicsMaterial;
	//startingLocationVEC3.z += 5.0;
	startingLocationVEC3.copy(boxBody.position);

	//Store references to each other for call backs.
	boxBody.userData = newPlayer;
	newPlayer.rigidBody = boxBody;
	this.world.add(boxBody);
	
	this.players.push(newPlayer);
	
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

function PlayerState(name, ID) {
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

	this.rigidBody; //The box has some sexy body.
}

//Const player variables.
PlayerState.WALKING_SPEED = 4000;
PlayerState.RUNNING_SPEED = 6000;
PlayerState.WALKING_ROT_SPEED = 1;
PlayerState.RUNNING_ROT_SPEED = 0.05;
PlayerState.MAX_WALKING_SPEED = .1;
PlayerState.MAX_RUNNING_SPEED = 40;
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
PlayerState.combinedDirectionBuffer = new CANNON.Vec3(0,0,0);//Combined direction stores a direction based on key input.
PlayerState.combinedDirection = new CANNON.Vec3(0,0,0);
PlayerState.FORWARD = new CANNON.Vec3(0,-1,0);

PlayerState.prototype.update = function(dt){
	this.position = this.rigidBody.position;
	this.rotationQuat = this.rigidBody.quaternion;
	this.rotationQuat.vmult(PlayerState.FORWARD, this.direction);

	//PlayerState.combinedDirectionBuffer.set(0,0,0);

	switch(this.motionDirection){
		case PlayerState.Direction.FORWARD:
			if(this.motion != PlayerState.Motion.STOPPED)PlayerState.combinedDirectionBuffer.y = 1;
			else PlayerState.combinedDirectionBuffer.y = 0;
		break;
		case PlayerState.Direction.BACKWARD:
			if(this.motion != PlayerState.Motion.STOPPED)PlayerState.combinedDirectionBuffer.y = -1;
			else PlayerState.combinedDirectionBuffer.y = 0;
		break;
		case PlayerState.Direction.LEFT:
			if(this.motion != PlayerState.Motion.STOPPED)PlayerState.combinedDirectionBuffer.x = -1;
			else PlayerState.combinedDirectionBuffer.x = 0;
		break;
		case PlayerState.Direction.RIGHT:
			if(this.motion != PlayerState.Motion.STOPPED)PlayerState.combinedDirectionBuffer.x = 1;
			else PlayerState.combinedDirectionBuffer.x = 0;
		break;
	}

	PlayerState.combinedDirectionBuffer.normalize();

	//this.rotationQuat.vmult(PlayerState.combinedDirectionBuffer, PlayerState.combinedDirection);

	if(this.motion == PlayerState.Motion.WALKING && this.rigidBody.velocity.distanceTo(PlayerState.ORIGIN) < PlayerState.WALKING_SPEED){
		var impulseDirection = new CANNON.Vec3(0,0,0);
		//this.position.copy(impulseDirection);

		//impulseDirection = impulseDirection.vsub(this.direction);
		impulseDirection = impulseDirection.vadd(PlayerState.combinedDirectionBuffer);
		impulseDirection = impulseDirection.mult(PlayerState.WALKING_SPEED);

		var position = new CANNON.Vec3(0,0);
		this.position.copy(position);
		position.y -= 0.5;
		//this.rigidBody.applyForce(new CANNON.Vec3(0,0,10000), this.position);
		this.rigidBody.applyForce(impulseDirection, position);

	}
	if(this.motion == PlayerState.Motion.RUNNING && this.rigidBody.velocity.distanceTo(PlayerState.ORIGIN) < PlayerState.RUNNING_SPEED){
		var impulseDirection = new CANNON.Vec3(0,0,0);
		//this.position.copy(impulseDirection);

		//impulseDirection = impulseDirection.vsub(this.direction);
		impulseDirection = impulseDirection.vadd(PlayerState.combinedDirectionBuffer);
		impulseDirection = impulseDirection.mult(PlayerState.RUNNING_SPEED);

		this.rigidBody.applyImpulse(impulseDirection, this.position);
	}

	if(this.rotation == PlayerState.Motion.WALKING){
		if(this.rotationDirection == PlayerState.Direction.LEFT){
			this.rigidBody.angularVelocity.z = PlayerState.WALKING_ROT_SPEED;
		} 
		else {
			this.rigidBody.angularVelocity.z = -PlayerState.WALKING_ROT_SPEED;
		}
		//this.rigidBody.applyImpulse(PlayerState.WALKING_SPEED, this.position);
	}
	if(this.rotation == PlayerState.Motion.RUNNING && this.rigidBody.velocity.distanceTo(PlayerState.ORIGIN) < PlayerState.RUNNING_SPEED){
		var impulseDirection = new CANNON.Vec3(0,0,0);
		//this.position.copy(impulseDirection);

		//impulseDirection.vsub(this.direction);
		impulseDirection.vadd(PlayerState.combinedDirection);

		//this.rigidBody.applyImpulse(PlayerState.RUNNING_SPEED, this.position);
	}

	if(this.motion == PlayerState.Motion.STOPPED && this.rotation == PlayerState.Motion.STOPPED){
		this.isMakingNoise = false;
	}
	else this.isMakingNoise = true;

}

function Protectile(speed, direction, ID) {
	this.ID = ID;

	//Positional
	this.position = null;
	this.direction = new CANNON.Vec3(0, -1, 0);
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

function GeometryState(shader, ID){
	this.ID = ID;
	this.position = null;
	this.rotationQuat = null;

	this.RigidBody = null;

	this.shader = "";
}

GeometryState.prototype.update = function(dt){
	this.position = this.RigidBody.position;
	this.rotationQuat = this.RigidBody.quaternion;
}
