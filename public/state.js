
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
/// The state of the game map is stored in this Class
function WorldState() {
	this.initPhysics();
	this.renderState = null;
	
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
		object.worldState = this;
	}.bind(this);
	
	this.projectiles = Container.createObjectContainer(function(key, data) {
		var projectile = new ProjectileState();
		
		projectile.deserialize(data, this.players);
		
		return projectile;
	}.bind(this));
	
	this.projectiles.deserializeObject = function(object, key, data) {
		object.deserialize(data, this.players);
	}.bind(this);
	
	this.projectiles.onAdd = function(object) {
		object.worldState = this;
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
		object.worldState = this;
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
		//boxes: this.boxes.serialize()
	};
}

WorldState.prototype.deserialize = function(data) {
	this.players.deserialize(data.players);
	this.projectiles.deserialize(data.projectiles);
	//this.boxes.deserialize(data.boxes);
}

WorldState.prototype.initPhysics = function(){
	//Initialise the world
	this.world = new CANNON.World();
	this.world.gravity.set(0,0,-9.82);
	
	this.world.broadphase = new CANNON.NaiveBroadphase();
	this.world.broadphase.useBoundingBoxes = true;
	//this.world.allowSleep = true;
	
	console.log("Creating physics world...");
	
	//var solver = new CANNON.GSSolver();
	//solver.iterations = 4;
	//solver.tolerance = 3;

	//this.world.solver = solver;
		
	//Initialise the physics contact materials.
	this.boxPhysicsMaterial = new CANNON.Material("BOX_PHY_MATERIAL");

	this.groundPhysicsMaterial = new CANNON.Material("GROUND_PHY_MATERIAL");
	this.groundPhysicsContactMaterial = new CANNON.ContactMaterial(this.groundPhysicsMaterial, this.boxPhysicsMaterial, {
		friction: 0.4,
		restitution: 0.3,
		contactEquationStiffness: 1e8,
		contactEquationRelaxation: 3,
		frictionEquationStiffness: 1e8,
		frictionEquationRegularizationTime: 3,
	});

	//orld.addContactMaterial(this.boxPhysicsContactMaterial);
	this.world.addContactMaterial(this.groundPhysicsContactMaterial);

	//this.world.quatNormalizeFast = true;
	//this.world.quatNormalizeSkip = 2;

	//Initialise the ground plane
	var groundShape = new CANNON.Plane();
	var groundBody = new CANNON.Body({mass: 0, shape: groundShape});
	groundBody.collisionFilterGroup = 1;
	groundBody.collisionFilterMask = 2;
	this.world.add(groundBody);
}

WorldState.prototype.update = function(dt) {
	this.world.step(dt);

	this.players.forEach(function(player){
		player.update(dt);
	});

	this.projectiles.forEach(function(projectile){
		projectile.update(dt);
	});
}

WorldState.prototype.addPlaneGeometry = function(locationVEC3, rotationVEC3, angleRAD){
	var body = new CANNON.Body({mass: 0, material: this.groundPhysicsMaterial});
	
	body.collisionFilterGroup = 1;
	body.collisionFilterMask = 2;
	
	body.addShape(new CANNON.Plane());
	body.position.copy(locationVEC3);
	body.quaternion.setFromAxisAngle(rotationVEC3,angleRAD);
	
	this.world.addBody(body);
	
	return body;
}

WorldState.prototype.addBoxGeometry = function(locationVEC3, halfExtentsVEC3, mass, sleeping) {
	var newBox = new BoxState(this.nextUniqueID++, locationVEC3, halfExtentsVEC3, mass, this.boxPhysicsMaterial, sleeping);

	this.boxes.push(newBox);
	
	return newBox;
}

WorldState.prototype.createPlayer = function(position) {
	var newPlayer = new PlayerState(this.nextUniqueID++, position, this.boxPhysicsMaterial);
	
	newPlayer.worldInside = this;
	
	if(this.renderState){
		newPlayer.renderer = new PlayerStateRenderer(this.renderState, newPlayer);
	}
	
	this.players.push(newPlayer);
	
	return newPlayer;
}

//Starting location and direction is a Vec3
WorldState.prototype.addProjectileState = function (startingLocation, startingSpeed ,startingDirection, emittedFrom){
	var newProjectile = new ProjectileState(this.nextUniqueID++, startingLocation, startingSpeed, startingDirection, emittedFrom);
	
	this.projectiles.push(newProjectile);
	
	return newProjectile;
}

function ProjectileState(ID, startingLocation, speed, direction, emittedFrom) {
	this.ID = ID;

	//Positional
	this.position = startingLocation;
	this.direction = direction;
	this.direction.normalize();
	this.speed = speed;
	this.bodyEmittedFrom = emittedFrom;
	this.worldState = null;
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

ProjectileState.prototype.update = function(dt) {
	var bodiesToIntersect = [];

	//Copy only the player bodies into the list for intersection
	this.worldState.players.forEach(function(player){ 
		bodiesToIntersect.push(player.rigidBody);
	});

	this.position.copy(ProjectileState.ORIGIN);
	this.ray = this.direction;//.mult(this.speed);
	this.ray.z = 0;

	var ray = new CANNON.Ray(ProjectileState.ORIGIN, this.ray);
	var intersections = ray.intersectBodies(bodiesToIntersect);
	
	for(var i = 0; i < intersections.length; i+=1){
		if(intersections[i] != this.bodyEmittedFrom){
			//intersections[i].body.applyForce(intersections[i].body.position, this.direction.mult(ProjectileState.KNOCK_BACK));
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
		this.worldState.projectiles.pop(this);
		console.log('Particle has died');
	//}

	//if(intersections.length > 0){
	//	console.log('Particle has collided!');
	//}

	
}

// Player state renderer

PlayerStateRenderer.MUZZLE_OFFSET = new CANNON.Vec3(0,1,0);
PlayerStateRenderer.MUZZLE_FLASH_TIME = 5;
function PlayerStateRenderer(scene, playerState){
	this.scene = scene;
	this.playerState = playerState;
	
	var muzLight =  new THREE.PointLight( 0xFFFFFF, 10, 100);
	muzLight.position.set(0,0,3);
	this.muzzleFlash = muzLight;
	scene.add(muzLight);
	
	var sphereSize = 1;
	var pointLightHelper = new THREE.PointLightHelper( muzLight, sphereSize );
	scene.add( pointLightHelper );
	
	this.muzzleTime = 0;
}

PlayerStateRenderer.prototype.update = function(dt){
	if(this.muzzleTime > 0){
		if((this.muzzleTime - dt) <= 0){
			this.scene.remove(this.muzzleFlash);
		}
		
		this.muzzleTime -= dt;
	}
}

PlayerStateRenderer.prototype.showMuzzleFlash = function(){
	this.muzzleTime = PlayerStateRenderer.MUZZLE_FLASH_TIME;
	
	this.muzzleFlash.position = new CANNON.Vec3(0,0,3);
	this.muzzleFlash.color.r = 1.0;
	this.muzzleFlash.color.g = 1.0;
	this.muzzleFlash.color.b = 1.0;
	
	this.scene.add(this.muzzleFlash);
}

// ** Player State **

function PlayerState(ID, position, material) {
	console.log("PlayerState:", ID, position, material);
	
	this.renderer = null;
	
	this.ID = ID;

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
	
	this.lastShotTime = 0;
	
	this.worldState = null;

	var boxHalfExtents = new CANNON.Vec3(WorldState.PLAYER_SIZE_HALF, WorldState.PLAYER_SIZE_HALF, WorldState.PLAYER_SIZE_HALF);
	var boxShape = new CANNON.Box(boxHalfExtents);
	this.rigidBody = new CANNON.Body({mass: WorldState.PLAYER_MASS, material: material});
	this.rigidBody.addShape(boxShape);
	
	this.rigidBody.collisionFilterGroup = 2;
	this.rigidBody.collisionFilterMask = 1 | 2;
	this.rigidBody.position.copy(position);
	
	this.rigidBody.angularDamping = WorldState.ANGULAR_DAMPING;
	this.rigidBody.userData = this;
}

PlayerState.prototype.serialize = function() {
	var p = this.rigidBody.position, q = this.rigidBody.quaternion, v = this.rigidBody.velocity, tau = this.rigidBody.tau;
	
	return [
		p.x, p.y, p.z,
		q.x, q.y, q.z, q.w,
		v.x, v.y, v.z,
		this.health,
		this.isShooting,
		this.isAlive,
		this.isReloading,
		this.roundsInClip,
		this.timeSpentReloading,
		this.isMakingNoise,
		this.motion,
		this.motionDirection,
		this.rotation,
		this.rotationDirection
	];
}

PlayerState.prototype.deserialize = function(data) {
	var body = this.rigidBody;
	
	body.position.set(data[0], data[1], data[2]);
	body.previousPosition.set(data[0], data[1], data[2]);
	body.interpolatedPosition.set(data[0], data[1], data[2]);
	body.initPosition.set(data[0], data[1], data[2]);
	
	body.quaternion.set(data[3], data[4], data[5], data[6]);
	body.velocity.set(data[7], data[8], data[9]);
	
	this.health = data[10];
	this.isShooting = data[11];
	this.isAlive = data[12];
	this.isReloading = data[13];
	this.roundsInClip = data[14];
	this.timeSpentReloading = data[15];
	this.isMakingNoise = data[16];
	
	this.motion = data[17];
	this.motionDirection = data[18];
	this.rotation = data[19];
	this.rotationDirection = data[20];
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
PlayerState.FORWARD = new CANNON.Vec3(0,1,0);

PlayerState.prototype.handleEvent = function(event, action){
	var motionState = null;
	var motionDirection = null;
	var eventType = null;
	
	if (action) motionState = PlayerState.Motion.WALKING;
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
			if(action) this.isRunning = true;
			else this.isRunning = false;
		break;
	}
}

PlayerState.prototype.update = function(dt){
	var movement = new CANNON.Vec3(0,0,0);
	
	switch(this.motionDirection){
		case PlayerState.Direction.FORWARD:
			if(this.motion != PlayerState.Motion.STOPPED)movement.y = 1;
			else movement.y = 0;
		break;
		case PlayerState.Direction.BACKWARD:
			if(this.motion != PlayerState.Motion.STOPPED)movement.y = -1;
			else movement.y = 0;
		break;
		case PlayerState.Direction.LEFT:
			if(this.motion != PlayerState.Motion.STOPPED)movement.x = -1;
			else movement.x = 0;
		break;
		case PlayerState.Direction.RIGHT:
			if(this.motion != PlayerState.Motion.STOPPED)movement.x = 1;
			else movement.x = 0;
		break;
	}
	
	this.rigidBody.applyForce(movement, CANNON.Vec3.ZERO);
	
	if(this.health <= 0 && this.isAlive){
		console.log('Player has died', this.ID);
		this.isAlive = false;
	}
}

// ** Box State **

function BoxState(ID, position, extents, mass, material, sleeping) {
	this.ID = ID;
	
	this.rigidBody = new CANNON.Body({mass: mass, material: material});
	this.rigidBody.addShape(new CANNON.Box(extents));
	
	this.rigidBody.position.copy(position);
	this.rigidBody.userData = this;

	this.rigidBody.collisionFilterGroup = 1;
	this.rigidBody.collisionFilterMask = 2;
	
	if (mass <= 1 || sleeping) {
		//this.rigidBody.allowSleep = true;
		//this.rigidBody.sleepState = 2;
		//this.rigidBody.sleep();
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
