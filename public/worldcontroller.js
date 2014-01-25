function WorldController(){
	this.worldState = new WorldState();
	this.currentPlayer = null;
}

WorldController.prototype.setup = function(playerName, initLocation){
	 this.currentPlayer = this.worldState.addPlayer(playerName, initLocation);
}

WorldController.prototype.update = function(dt){
	this.worldState.update(dt);
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