/// *** Class Gamestate ***
/// The state of the gmae map is stored in this Class
function WorldState() {
	this.players = new Container();
	this.projectiles = new Container();
	this.geometry = new Container();
	
	this.obstructions = new Container();
	
	this.playerIDCounter = 0;
	this.projectileIDCounter = 0;
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
WorldState.PROJECTILE_MASS = 0.1;


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
																0.0005,
																.3);

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

WorldState.prototype.addBoxGeometry = function(locationVEC3, halfExtentsVEC3, mass, shader){
	var newGeometry = new GeometryState(shader, this.geometryIDCounter++);
	this.geometry.add(newGeometry);

	// var tileInside = new Vec2(startingLocationVEC2[0] / this.tileMap.tileSize[0], startingLocationVEC2[1] / this.tileMap.tileSize[1]);
	// newPlayer.tileInside = this.tileMap.get(tileInside);
	// tileInside.playersInTile.push(newPlayer);

	//Create box shape and add it to the world.
	var boxShape = new CANNON.Box(halfExtentsVEC3);
	var boxBody = new CANNON.RigidBody(mass, boxShape, this.boxPhysicsMaterial);

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
	startingLocationVEC3.z += 1;
	startingLocationVEC3.copy(boxBody.position);

	//Store references to each other for call backs.
	boxBody.userData = newPlayer;
	newPlayer.rigidBody = boxBody;
	this.world.add(boxBody);
	newPlayer.worldInside = this;
	
	this.players.push(newPlayer);
	
	return newPlayer;
}

WorldState.prototype.removePlayer = function(player){
	this.players.pop(player);
	this.world.remove(player.RigidBody);
}

//Starting location and direction is a Vec3
WorldState.prototype.addProjectile = function(startingLocation, startingSpeed ,startingDirection, emittedFrom){
	// projShape = new CANNON.Sphere(WorldState.PROJECTILE_SIZE_HALF);
	// projBody = new CANNON.RigidBody(WorldState.PROJECTILE_MASS, projShape, this.boxPhysicsMaterial);
	// projBody.position.set(startingLocation[0], startingLocation[1], startingLocation[2]);

	//Get the direciton of the projectile, mult by speed and set that as the initial velocity of the projectile.
	// var initVelocity = new CANNON.Vec3(0,0,0);
	// startingDirection.copy(initVelocity);
	// initVelocity.mult(startingSpeed);
	// projBody.initVelocity = initVelocity;

	var newProjectile = new Projectile(startingLocation, startingSpeed, startingDirection, emittedFrom, this.projectileIDCounter++);

	// projBody.userData = newProjectile;
	// newProjectile.rigidBody = projBody;

	// this.world.add(projBody);
	newProjectile.worldInside = this;
	this.projectiles.push(newProjectile);

}

WorldState.prototype.removeProjectile = function(projectile){
	this.projectiles.pop(projectile);
}

function PlayerState(name, ID) {
	this.ID = ID;

	//Positional
	this.position = null;
	this.direction = new CANNON.Vec3(0, 0, 0);
	this.rotationQuat = null;
	this.velocity = null;

	//Internal state / control state
	this.motion = PlayerState.Motion.STOPPED;
	this.motionDirection = PlayerState.Direction.FORWARD;
	this.rotation = PlayerState.Motion.STOPPED;
	this.rotationDirection = PlayerState.Direction.LEFT;
	this.health = PlayerState.HEALTH;
	this.isMakingNoise  = false;
	this.isRunning = false;
	this.isShooting = false;
	this.isAlive = true;

	this.worldInside = null;
	this.name = name;

	this.rigidBody; //The box has some sexy body.
}

PlayerState.STATE_ARRAY = new Array();
PlayerState.prototype.serialize = function(){
	var arrayCounter = 0;
	PlayerState.STATE_ARRAY[arrayCounter++] = this.position.x;
	PlayerState.STATE_ARRAY[arrayCounter++] = this.position.y;
	PlayerState.STATE_ARRAY[arrayCounter++] = this.position.z;

	PlayerState.STATE_ARRAY[arrayCounter++] = this.rotationQuat.x;
	PlayerState.STATE_ARRAY[arrayCounter++] = this.rotationQuat.y;
	PlayerState.STATE_ARRAY[arrayCounter++] = this.rotationQuat.z;
	PlayerState.STATE_ARRAY[arrayCounter++] = this.rotationQuat.w;

	PlayerState.STATE_ARRAY[arrayCounter++] = this.velocity.x;
	PlayerState.STATE_ARRAY[arrayCounter++] = this.velocity.y;
	PlayerState.STATE_ARRAY[arrayCounter++] = this.velocity.z;

	PlayerState.STATE_ARRAY[arrayCounter++] = this.health;

	PlayerState.STATE_ARRAY[arrayCounter++] = this.isALive;

	return STATE_ARRAY;

}

PlayerState.prototype.deserialize = function(array){
	var arrayCounter = 0;

	this.position.x = array[arrayCounter++];
	this.position.y = array[arrayCounter++];
	this.position.z = array[arrayCounter++];

	this.rotationQuat.x = array[arrayCounter++];
	this.rotationQuat.y = array[arrayCounter++];
	this.rotationQuat.z = array[arrayCounter++];
	this.rotationQuat.w = array[arrayCounter++];

	this.velocity.x = array[arrayCounter++];
	this.velocity.y = array[arrayCounter++];
	this.velocity.z = array[arrayCounter++];

	this.rigidBody.position = this.position;
	this.rigidBody.quaternion = this.rotationQuat;
	this.rigidBody.velocity = this.velocity;

	this.health = array[arrayCounter++];
	this.isALive = array[arrayCounter++];
}

//Const player variables.
PlayerState.WALKING_SPEED = 4000;
PlayerState.RUNNING_SPEED = 8000;
PlayerState.WALKING_ROT_SPEED = 0.7;
PlayerState.RUNNING_ROT_SPEED = 2;
PlayerState.MAX_WALKING_SPEED = 4002;
PlayerState.MAX_RUNNING_SPEED = 8004;
PlayerState.FIRE_RATE_PER_SECOND = 1;
PlayerState.BULLET_SPEED = 1;
PlayerState.Motion = {
	WALKING: 1,
	STOPPED: 2,
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

// PlayerState.prototype.setRunning = function(running){
// 	this.
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
PlayerState.FORWARD = new CANNON.Vec3(0,1,0);
PlayerState.finalImpulseDir = new CANNON.Vec3(0,0,0);
PlayerState.lastShotTime = 0;


PlayerState.prototype.update = function(dt){
	this.position = this.rigidBody.position;
	this.rotationQuat = this.rigidBody.quaternion;
	//this.rotationQuat.vmult(PlayerState.FORWARD, this.direction);
	
	if(this.isShooting){
		if(PlayerState.FIRE_RATE_PER_SECOND < PlayerState.lastShotTime){
			bulletDirection = this.rotationQuat.vmult(PlayerState.FORWARD);
			//bulletPosition = this.rigidBody.position.vadd(bulletDirection.mult(2.0));
			this.worldInside.addProjectile(this.rigidBody.position, PlayerState.BULLET_SPEED, bulletDirection, this);
			PlayerState.lastShotTime = 0;
		}
	}
	PlayerState.lastShotTime += dt;
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

	if(this.motion == PlayerState.Motion.WALKING){
		var impulseDirection = new CANNON.Vec3(0,0,0);
		//this.position.copy(impulseDirection);

		//impulseDirection = impulseDirection.vsub(this.direction);
		impulseDirection = impulseDirection.vadd(PlayerState.combinedDirectionBuffer);
		impulseDirection = impulseDirection.mult(((this.isRunning) ? PlayerState.RUNNING_SPEED : PlayerState.WALKING_SPEED));

		this.rotationQuat.vmult(impulseDirection, PlayerState.finalImpulseDir);

		var finalLength = this.rigidBody.velocity.vadd(PlayerState.finalImpulseDir).distanceTo(PlayerState.ORIGIN);
		var position = new CANNON.Vec3(0,0);
		this.position.copy(position);
		//position.y -= 0.5;
		///this.rigidBody.applyForce(new CANNON.Vec3(0,0,10000), this.position);
		if(finalLength < ((!this.isRunning) ? PlayerState.MAX_WALKING_SPEED : PlayerState.MAX_RUNNING_SPEED))this.rigidBody.applyForce(PlayerState.finalImpulseDir, position);

	}

	if(this.rotation == PlayerState.Motion.WALKING){
		if(this.rotationDirection == PlayerState.Direction.LEFT){
			this.rigidBody.angularVelocity.z = ((this.sRunning) ? PlayerState.RUNNING_ROT_SPEED : PlayerState.WALKING_ROT_SPEED);
		} 
		else {
			this.rigidBody.angularVelocity.z = ((this.isRunning) ? -PlayerState.RUNNING_ROT_SPEED : -PlayerState.WALKING_ROT_SPEED);
		}
		//this.rigidBody.applyImpulse(PlayerState.WALKING_SPEED, this.position);
	}

	if(this.motion == PlayerState.Motion.STOPPED && this.rotation == PlayerState.Motion.STOPPED){
		this.isMakingNoise = false;
	}
	else this.isMakingNoise = true;

	if(this.health <= 0 && this.isAlive){
		console.log('Player has died');
		this.isAlive = false;
	}

}

function Projectile(startingLocation, speed, direction, emittedFrom, ID) {
	this.ID = ID;

	//Positional
	this.position = startingLocation;
	this.direction = direction;
	this.direction.normalize();
	this.speed = speed;
	this.bodyEmittedFrom = emittedFrom;
	this.worldInside = null;
	//this.timeaAlive = 0;
}

Projectile.ORIGIN = new CANNON.Vec3(0,0,0); //constant used for distance calculations
//Projectile.LIFETIME_MS = 0.5;
Projectile.KNOCK_BACK = 40000;
Projectile.DAMAGE = 30;
Projectile.bodiesToIntersect = new Array();
Projectile.prototype.update = function(dt){

	//Fill the bodies to intersect array
	while(Projectile.bodiesToIntersect.length > 0){
		Projectile.bodiesToIntersect.pop(); //Clear the array
	}

	//Copy only the player bodies into the list for intersection
	this.worldInside.players.forEach(function(player){
		Projectile.bodiesToIntersect.push(player.rigidBody);
	});

	this.position.copy(Projectile.ORIGIN);
	this.ray = this.direction;//.mult(this.speed);
	this.ray.z = 0;

	var ray = new CANNON.Ray(Projectile.ORIGIN, this.ray);
	var intersections = ray.intersectBodies(Projectile.bodiesToIntersect);
	
	for(var i = 0; i < intersections.length; i+=1){
		if(intersections[i] != this.bodyEmittedFrom){
			intersections[i].body.applyForce(intersections[i].body.position, this.direction.mult(Projectile.KNOCK_BACK));
			if(intersections[i].body.userData && intersections[i].body.userData instanceof PlayerState){
				intersections[i].body.userData.doDamage(Projectile.DAMAGE);
				console.log('Damage done', Projectile.DAMAGE);
			}
		
			i = intersections.length+1;
			//this.timeAlive = Projectile.LIFETIME_MS+1;
		}
	}
	//this.position = this.position.vadd(this.direction.mult(this.speed));

	//this.timeAlive += dt;
	//if(this.timeAlive > Projectile.LIFETIME_MS){
		this.worldInside.removeProjectile(this);
		console.log('Particle has died');
	//}

	//if(intersections.length > 0){
	//	console.log('Particle has collided!');
	//}

	
}

function GeometryState(shader, ID){
	this.ID = ID;
	this.position = null;
	this.rotationQuat = null;
	this.ray = null
	this.rigidBody = null;

	this.shader = "";
}

GeometryState.prototype.update = function(dt){
	this.position = this.rigidBody.position;
	this.rotationQuat = this.rigidBody.quaternion;


}
