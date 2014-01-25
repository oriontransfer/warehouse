
function WorldController() {
	this.worldState = new WorldState();
	this.currentPlayer = null;
	
	this.scene = new THREE.Scene(),
	
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
	this.camera.position.z = 5;
	
	this.playerGeometryController = new GeometryController(this.scene, this.worldState.players);
	
	this.currentPlayer = this.worldState.addPlayer("Mr Pickles", new CANNON.Vec3(0, 0, 0));
}

WorldController.prototype.setup = function() {
}

WorldController.prototype.update = function(dt) {
	this.worldState.update(dt);
	
	this.playerGeometryController.update();
	
	console.log(this.currentPlayer.position.x);
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
	}
	if(eventType){
		switch(eventType){
			case EventType.POSITIONAL:
				this.currentPlayer.setMotionState(motionState, motionDirection);
			break;
			case EventType.ROTATIONAL:
				this.currentPlayer.setRotationState(motionState, motionDirection);
			break;
			case EventType.SHOOTING:
			break;
		}
	
	}
}