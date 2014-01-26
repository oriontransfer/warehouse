
// A list of possible user events:
Event = {
	NONE: 0,
	MOVE_FORWARDS: 1,
	MOVE_BACKWARDS: 2,
	ROTATE_LEFT: 3,
	ROTATE_RIGHT: 4,
	STRAFE_LEFT: 5,
	STRAFE_RIGHT: 6,
	SHOOT: 7,
	
	FAST: 32
};

EventType = {
	POSITIONAL: 0,
	ROTATIONAL: 2,
	SHOOTING: 1,
	FAST: 3,
};

/// *** Class Gamestate ***
/// The state of the gmae map is stored in this Class
function WorldState() {
	this.initPhysics();
	
	// ** Player Container **
	this.players = Container.createObjectContainer(function(key, data) {
		var player = new PlayerState(key, new CANNON.Vec3(0, 0, 0), this.boxPhysicsMaterial);
		
		player.deserialize(data);
		
		return player;
	}.bind(this));
	
	this.players.onRemove = function(object) {
		this.world.remove(object.rigidBody);
	}.bind(this);
	
	this.players.onAdd = function(object) {
		this.world.add(object.rigidBody);
		object.insideWorld = this;
	}.bind(this);
	
	this.players.deserializeObject = function(object, key, data) {
		object.deserialize(data);
		
		this.world.remove(object.rigidBody);
		var body = object.rigidBody;
		
		// We forcefully update the state of the rigid body:
		body.position.copy(body.initPosition);
		body.velocity.copy(body.initVelocity);
		body.quaternion.copy(body.initQuaternion);
		
		this.world.add(object.rigidBody);
	}.bind(this);
	
	this.projectiles = new Container();
	
	this.projectiles.deserializeObject = function(object, key, data) {
		object.deserialize(data, this.players);
	}.bind(this);
	
	// ** Box Container **
	this.boxes = new Container.createObjectContainer(function(key, data) {
		var box = new BoxState(key);
		
		box.deserialize(data);
		
		return box;
	});
	
	this.boxes.onRemove = function(object) {
		this.world.remove(object.rigidBody);
	}.bind(this);
	
	this.boxes.onAdd = function(object) {
		this.world.add(object.rigidBody);
		object.insideWorld = this;
	}.bind(this);
	
	this.nextUniqueID = 0;
}

//Const world variables
WorldState.PLAYER_SIZE_HALF = 0.8;
WorldState.PLAYER_MASS = 2515 * 0.5;
WorldState.ANGULAR_DAMPING = 0.99;

WorldState.PROJECTILE_SIZE_HALF = 0.05;
WorldState.PROJECTILE_MASS = 0.1;

WorldState.prototype.serialize = function() {
	return {
		players: this.players.serialize(),
		projectiles: this.projectiles.serialize(),
		boxes: this.boxes.serialize()
	};
}

WorldState.ZERO_VEC = new CANNON.Vec3(0,0,0);

WorldState.prototype.deserialize = function(data) {
	this.players.deserialize(data.players);
	this.projectiles.deserialize(data.projectiles);
	this.boxes.deserialize(data.boxes);
}

WorldState.prototype.initPhysics = function(){
	//Initialise the world
	this.world = new CANNON.World();
	this.world.broadphase = new CANNON.NaiveBroadphase();
	world = this.world;
	this.world.broadphase.useBoundingBoxes = true;

	solver = new CANNON.GSSolver();

	// world.defaultContactMaterial.contactEquationStiffness = 1e8;
 //    world.defaultContactMaterial.contactEquationRegularizationTime = 3;

    solver.iterations = 20;
    solver.tolerance = 0;

    world.solver = new CANNON.SplitSolver(solver);

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

WorldState.prototype.addBoxGeometry = function(locationVEC3, halfExtentsVEC3, mass) {
	var newBox = new BoxState(this.nextUniqueID++, locationVEC3, halfExtentsVEC3, mass, this.boxPhysicsMaterial);

	this.boxes.push(newBox);
	
	return newBox;
}

WorldState.prototype.createPlayer = function(position) {
	var newPlayer = new PlayerState(this.nextUniqueID++, position, this.boxPhysicsMaterial);

	this.players.push(newPlayer);

	return newPlayer;
}


//Starting location and direction is a Vec3
WorldState.prototype.addProjectileState = function (startingLocation, startingSpeed ,startingDirection, emittedFrom){
	var newProjectileState = new ProjectileState(this.nextUniqueID++, startingLocation, startingSpeed, startingDirection, emittedFrom);
	this.projectiles.push(newProjectileState);
	
	// projShape = new CANNON.Sphere(WorldState.PROJECTILE_SIZE_HALF);
	// projBody = new CANNON.RigidBody(WorldState.PROJECTILE_MASS, projShape, this.boxPhysicsMaterial);
	// projBody.position.set(startingLocation[0], startingLocation[1], startingLocation[2]);

	//Get the direciton of the projectile, mult by speed and set that as the initial velocity of the projectile.
	// var initVelocity = new CANNON.Vec3(0,0,0);
	// startingDirection.copy(initVelocity);
	// initVelocity.mult(startingSpeed);
	// projBody.initVelocity = initVelocity;

	
	// projBody.userData = newProjectileState;
	// newProjectileState.rigidBody = projBody;

	// this.world.add(projBody);
}

function ProjectileState(ID, startingLocation, speed, direction, emittedFrom) {
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

ProjectileState.prototype.serialize = function(){
	var p = this.position, d = this.direction;
	
	return [
		p.x, p.y, p.z,
		d.x, d.y, d.z,
		bodyEmittedFrom.ID
	];
}

ProjectileState.prototype.deserialize = function(data, players) {
	this.position.set(data[0], data[1], data[2]);
	this.direction.set(data[3], data[4], data[5]);
	
	this.bodyEmittedFrom = players.values[data[6]];
}

ProjectileState.ORIGIN = new CANNON.Vec3(0,0,0); //constant used for distance calculations
//ProjectileState.LIFETIME_MS = 0.5;
ProjectileState.KNOCK_BACK = 40000;
ProjectileState.DAMAGE = 30;
ProjectileState.bodiesToIntersect = new Array();
ProjectileState.prototype.update = function(dt){

	//Fill the bodies to intersect array
	while(ProjectileState.bodiesToIntersect.length > 0){
		ProjectileState.bodiesToIntersect.pop(); //Clear the array
	}

	//Copy only the player bodies into the list for intersection
	this.worldInside.players.forEach(function(player){
		ProjectileState.bodiesToIntersect.push(player.rigidBody);
	});

	this.position.copy(ProjectileState.ORIGIN);
	this.ray = this.direction;//.mult(this.speed);
	this.ray.z = 0;

	var ray = new CANNON.Ray(ProjectileState.ORIGIN, this.ray);
	var intersections = ray.intersectBodies(ProjectileState.bodiesToIntersect);
	
	for(var i = 0; i < intersections.length; i+=1){
		if(intersections[i] != this.bodyEmittedFrom){
			intersections[i].body.applyForce(intersections[i].body.position, this.direction.mult(ProjectileState.KNOCK_BACK));
			if(intersections[i].body.userData && intersections[i].body.userData instanceof PlayerState){
				intersections[i].body.userData.doDamage(ProjectileState.DAMAGE);
				console.log('Damage done', ProjectileState.DAMAGE);
			}
		
			i = intersections.length+1;
			//this.timeAlive = ProjectileState.LIFETIME_MS+1;
		}
	}
	//this.position = this.position.vadd(this.direction.mult(this.speed));

	//this.timeAlive += dt;
	//if(this.timeAlive > ProjectileState.LIFETIME_MS){
		this.worldInside.projectiles.pop(this);
		console.log('Particle has died');
	//}

	//if(intersections.length > 0){
	//	console.log('Particle has collided!');
	//}

	
}

// ** Player State **



function PlayerState(ID, position, material) {
	this.ID = ID;

	//Positional
	this.position = position;
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
	this.isReloading = false;
	this.roundsInClip = PlayerState.CLIP_SIZE;
	this.timeSpentReloading = 0;

	this.worldInside = null;

	var boxHalfExtents = new CANNON.Vec3(WorldState.PLAYER_SIZE_HALF, WorldState.PLAYER_SIZE_HALF, WorldState.PLAYER_SIZE_HALF);
	var boxShape = new CANNON.Box(boxHalfExtents);
	this.rigidBody = new CANNON.RigidBody(WorldState.PLAYER_MASS, boxShape, material);

	this.rigidBody.angularDamping = WorldState.ANGULAR_DAMPING;
	this.rigidBody.userData = this;
}

PlayerState.prototype.serialize = function() {
	var p = this.rigidBody.position, q = this.rigidBody.quaternion, v = this.rigidBody.velocity;
	
	return [
		p.x, p.y, p.z,
		q.x, q.y, q.z, q.w,
		v.x, v.y, v.z,
		this.health,
		this.isShooting,
		this.isAlive,
		this.isReloading,
		this.roundsInClip,
		this.timeSpentReloading
	];
}

PlayerState.prototype.deserialize = function(data) {
	var r = this.rigidBody;
	
	r.position.set(data[0], data[1], data[2]);
	r.quaternion.set(data[3], data[4], data[5], data[6]);
	r.velocity.set(data[7], data[8], data[9]);
	
	this.health = data[10];
	this.isShooting = data[11];
	this.isAlive = data[12];
	this.isReloading = data[13];
	this.roundsInClip = data[14];
	this.timeSpentReloading = data[15];
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
PlayerState.RELOAD_TIME = 3;
PlayerState.CLIP_SIZE = 6;

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

PlayerState.prototype.doDamage = function(damage){
	this.health -= damage;
}

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

PlayerState.prototype.handleEvent = function(event, action){
	var motionState = null
	var motionDirection = null;
	var eventType = null;
	if(action){
		motionState = PlayerState.Motion.WALKING;
	}
	else motionState = PlayerState.Motion.STOPPED;

	switch(event){
		case Event.MOVE_FORWARDS:
			eventType = EventType.POSITIONAL
			motionDirection = PlayerState.Direction.FORWARD;
		break;
		case Event.MOVE_BACKWARDS:
			eventType = EventType.POSITIONAL
			motionDirection = PlayerState.Direction.BACKWARD;
		break;
		case Event.ROTATE_LEFT:
			eventType = EventType.ROTATIONAL;
			motionDirection = PlayerState.Direction.LEFT;
		break;
		case Event.ROTATE_RIGHT:
			eventType = EventType.ROTATIONAL;
			motionDirection = PlayerState.Direction.RIGHT;
		break;
		case Event.STRAFE_LEFT:
			eventType = EventType.POSITIONAL
			motionDirection = PlayerState.Direction.LEFT;
		break;
		case Event.STRAFE_RIGHT:
			eventType = EventType.POSITIONAL;
			motionDirection = PlayerState.Direction.RIGHT;
		break;
		case Event.SHOOT:
			eventType = EventType.SHOOTING;
		break;
		case Event.FAST:
			eventType = EventType.FAST;
		break;
	}

	switch(eventType){
		case EventType.POSITIONAL:
			this.setMotionState(motionState, motionDirection);
		break;
		case EventType.ROTATIONAL:
			this.setRotationState(motionState, motionDirection);
		break;
		case EventType.SHOOTING:
			if(action)this.isShooting = true;
			else this.isShooting = false;
		break;
		case EventType.FAST:
			//console.log("FAST ");
			if(action) this.isRunning = true;
			else this.isRunning = false;
		break;
	}
}

PlayerState.prototype.update = function(dt){
	this.position = this.rigidBody.position;
	this.rotationQuat = this.rigidBody.quaternion;
	this.velocity = this.rigidBody.velocity;
	//this.rotationQuat.vmult(PlayerState.FORWARD, this.direction);
	
	if(this.isShooting){
		if(this.isReloading){
			if(this.timeSpentReloading >= PlayerState.RELOAD_TIME){
				this.isReloading = false;
				this.roundsInClip = PlayerState.CLIP_SIZE;
			}
			this.timeSpentReloading += dt;
		}
		else if(PlayerState.FIRE_RATE_PER_SECOND < PlayerState.lastShotTime){
			bulletDirection = this.rotationQuat.vmult(PlayerState.FORWARD);
			//bulletPosition = this.rigidBody.position.vadd(bulletDirection.mult(2.0));
			this.worldInside.addProjectileState(this.rigidBody.position, PlayerState.BULLET_SPEED, bulletDirection, this);
			PlayerState.lastShotTime = 0;
			this.roundsInClip -= 1;
			if(this.roundsInClip < 1){
				console.log('Reloading clip');
				this.isReloading = true;
				this.timeSpentReloading = 0;
			}
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
			this.rigidBody.angularVelocity.z = ((this.isRunning) ? PlayerState.RUNNING_ROT_SPEED : PlayerState.WALKING_ROT_SPEED);
		} 
		else {
			this.rigidBody.angularVelocity.z = ((this.isRunning) ? -PlayerState.RUNNING_ROT_SPEED : -PlayerState.WALKING_ROT_SPEED);
		}
		//this.rigidBody.applyImpulse(PlayerState.WALKING_SPEED, this.position);
	}

	if(this.motion == PlayerState.Motion.STOPPED && PlayerState.combinedDirectionBuffer.y == 0 && PlayerState.combinedDirectionBuffer.x == 0){
			this.rigidBody.velocity = new CANNON.Vec3(0,0,0);
	}

	if(this.rotation == PlayerState.Motion.STOPPED){
			this.rigidBody.angularVelocity = new CANNON.Vec3(0,0,0);
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

// ** Box State **

function BoxState(ID, position, extents, mass, material) {
	this.ID = ID;
	
	var boxShape = new CANNON.Box(extents);
	this.rigidBody = new CANNON.RigidBody(mass, boxShape, material);
	
	this.rigidBody.position = position;
	this.rigidBody.userData = this;
	
	if (mass <= 1) {
		this.rigidBody.allowSleep = true;
		this.rigidBody.sleepState = 2;
	}
}

BoxState.prototype.serialize = function() {
	var p = this.rigidBody.position, q = this.rigidBody.quaternion;
	
	return [
		p.x, p.y, p.z,
		q.x, q.y, q.z, q.w
	];
}

BoxState.prototype.deserialize = function(data) {
	var r = this.rigidBody;
	
	r.position.set(data[0], data[1], data[2]);
	r.quaternion.set(data[3], data[4], data[5], data[6]);
}
