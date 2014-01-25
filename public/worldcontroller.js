
function WorldController() {
	this.worldState = new WorldState();
	this.currentPlayer = null;
	
	this.currentPlayer = this.worldState.addPlayer("Mr Pickles", CANNON.Vec3(0, 0, 0));
	
	this.scene = new THREE.Scene(),
	
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
	this.camera.position.z = 5;
	
	this.geometryController = new GeometryController(this.scene, this.worldState);
}

WorldController.prototype.setup = function(scene) {
	this.geometryController.initialize();
}

WorldController.prototype.update = function(dt) {
	this.worldState.update(dt);
	this.geometryController.update();
}

WorldController.prototype.render = function(renderer) {
	renderer.render(this.scene, this.camera);
}

EventType = {
	POSITIONAL: 0,
	ROTATIONAL: 2,
	SHOOTING: 1,
};

WorldController.prototype.handleEvent = function(event, action){
	console.log(event, action);

	var motionState = null
	var motionDirection = null;
	var eventType = null;
	motionState = PlayerState.Motion.WALKING;
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
	}
	if(eventType){
		switch(eventType){
			case EventType.POSITIONAL:
				currentPlayer.setMotionState(motionState, motionDirection);
			break;
			case EventType.ROTATIONAL:
				currentPlayer.setRotationState(motionState, motionDirection);
			break;
			case EventType.SHOOTING:
			break;
		}
	
	}
}