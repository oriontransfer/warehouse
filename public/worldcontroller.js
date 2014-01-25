
function WorldController() {
	this.worldState = new WorldState();
	this.currentPlayer = null;
	
	this.scene = new THREE.Scene();
	
	var ambientLight = new THREE.AmbientLight(0xFFFFFF);
	this.scene.add(ambientLight);
	
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
	
	this.camera.position.z = 10;
	
    this.camera.rotateOnAxis((new THREE.Vector3(1, 0, 0)).normalize(), D2R(15));
	
	this.playerGeometryController = new GeometryController(this.scene, this.worldState.players);
	
	this.currentPlayer = this.worldState.addPlayer("Mr Pickles", new CANNON.Vec3(0, 0, 0));
	this.worldState.addPlayer("Bob", new CANNON.Vec3(5, 5, 0));
	this.worldState.addPlayer("John", new CANNON.Vec3(-5, 5, 0));
	this.worldState.addPlayer("Peach", new CANNON.Vec3(-5, 2, 0));
		
	this.floorController = new FloorController(this.scene, [32, 12]);
	this.floorController.generate();
	
	this.wallController = new WallController(this.scene, [32, 12]);
	this.wallController.generate();
	
	//WALLS COLLISION
	this.worldState.addBoxGeometry(new CANNON.Vec3(-5,12*4,0), new CANNON.Vec3(1,12*4+4,100), 0, "");//left
	this.worldState.addBoxGeometry(new CANNON.Vec3(32*8-3,12*4,0), new CANNON.Vec3(1,12*4+4,100), 0, "");//right
	this.worldState.addBoxGeometry(new CANNON.Vec3(32*4,12*8-3,0), new CANNON.Vec3(32*8,1,100), 0, "");//up
	this.worldState.addBoxGeometry(new CANNON.Vec3(32*4,-5,0), new CANNON.Vec3(32*8,1,100), 0, "");//down
}

WorldController.prototype.setup = function() {
}

WorldController.prototype.update = function(dt) {
	this.worldState.update(dt);
	
	this.playerGeometryController.update();
	
	this.currentPlayer.rigidBody.position.copy(this.camera.position);
	this.camera.position.z = 10;
	this.camera.position.y -= 2.5;

	//console.log(this.currentPlayer.position.x);
}

WorldController.prototype.render = function(renderer) {
	renderer.render(this.scene, this.camera);
}

EventType = {
	POSITIONAL: 0,
	ROTATIONAL: 2,
	SHOOTING: 1,
	FAST: 3,
};

WorldController.prototype.handleEvent = function(event, action){
	//console.log(event, action);

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
	//if(eventType){
		switch(eventType){
			case EventType.POSITIONAL:
				this.currentPlayer.setMotionState(motionState, motionDirection);
			break;
			case EventType.ROTATIONAL:
				this.currentPlayer.setRotationState(motionState, motionDirection);
			break;
			case EventType.SHOOTING:
				if(action)this.currentPlayer.isShooting = true;
				else this.currentPlayer.isShooting = false;
			break;
			case EventType.FAST:
				console.log("FAST ");
				if(action) this.currentPlayer.isRunning = true;
				else this.currentPlayer.isRunning = false;
			break;
		}
	
	//}
}