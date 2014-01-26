
function WorldController() {
	this.worldState = new WorldState();
	this.currentPlayer = null;
	
	this.scene = new THREE.Scene();
	
	var ambientLight = new THREE.AmbientLight(0x111111);
	this.scene.add(ambientLight);
	
	//this.scene.fog = new THREE.Fog(0x59472b, 25, 40);
	this.scene.fog = new THREE.Fog(0x000000, 25, 40);

	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 10, 100);
	this.camera.position.z = 20;
    this.camera.rotateOnAxis((new THREE.Vector3(1, 0, 0)).normalize(), D2R(45));
	
	this.playerGeometryController = new GeometryController(this.scene, this.worldState.players);
	
	var light = new THREE.SpotLight(0xffffff, 2.5, 50, D2R(72/2), 2.0);
	light.position.set(10, 10, 10);
	light.target.position.set(5, 5, 0);
	light.castShadow = true;

	light.shadowCameraNear = 1.0;
	light.shadowCameraFar = 40.0;
	light.shadowCameraFov = 72.0;
	
	light.shadowBias = 0.001;
	light.shadowDarkness = 1.0;
	
	light.shadowMapWidth = 1024;
	light.shadowMapHeight = 1024;
	
	//light.shadowCameraVisible = true;
	
	this.playerLight = light;
	this.scene.add(this.playerLight);
	
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

WorldController.prototype.setup = function(renderer) {
	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFShadowMap;
	
	renderer.setClearColor(this.scene.fog.color, 1);
	renderer.autoClear = false;
}

WorldController.prototype.createInterface = function() {
	var aspect = window.innerWidth / window.innerHeight;

	this.cameraOrtho = new THREE.OrthographicCamera(- aspect, aspect,  1, - 1, 1, 10);
	this.cameraOrtho.position.z = 5;

	var shader = THREE.UnpackDepthRGBAShader;
	var uniforms = new THREE.UniformsUtils.clone(shader.uniforms);

	uniforms.tDiffuse.value = this.playerLight.shadowMap;

	var hudMaterial = new THREE.ShaderMaterial({vertexShader: shader.vertexShader, fragmentShader: shader.fragmentShader, uniforms: uniforms});
	var hudHeight = 2 / 3;
	var hudWidth = hudHeight * this.playerLight.shadowMapWidth / this.playerLight.shadowMapHeight;

	var hudGeo = new THREE.PlaneGeometry(hudWidth, hudHeight);
	hudGeo.applyMatrix(new THREE.Matrix4().makeTranslation(hudWidth / 2, hudHeight / 2, 0));

	this.hudMesh = new THREE.Mesh(hudGeo, hudMaterial);

	this.hudMesh.position.x = this.cameraOrtho.left + 0.05;
	this.hudMesh.position.y = this.cameraOrtho.bottom + 0.05;

	this.sceneHUD = new THREE.Scene();
	this.sceneHUD.add(this.hudMesh);

	this.cameraOrtho.lookAt(this.sceneHUD.position);
}

WorldController.prototype.resizeWindow = function(width, height) {
	var aspect = width / height;
	
	this.camera.aspect = aspect;
	this.camera.updateProjectionMatrix();

	if (this.cameraOrtho) {
		this.cameraOrtho.left = -aspect;
		this.cameraOrtho.right = aspect;
		this.cameraOrtho.top = 1;
		this.cameraOrtho.bottom = -1;
		this.cameraOrtho.updateProjectionMatrix();

		this.hudMesh.position.x = this.cameraOrtho.left + 0.05;
		this.hudMesh.position.y = this.cameraOrtho.bottom + 0.05;
	}
}

WorldController.FORWARD = new CANNON.Vec3(0,7,0);
WorldController.FORWARD_ROT = new CANNON.Vec3(0,0,0);

WorldController.prototype.updateCurrentPlayer = function() {
	//this.currentPlayer.rigidBody.position.copy(this.camera.position);
	
	WorldController.FORWARD_ROT = this.currentPlayer.rigidBody.quaternion.vmult(WorldController.FORWARD); //Rotate the camera so we see more of what's infront of the user
	
	WorldController.FORWARD_ROT.copy(this.camera.position);
	this.camera.position = WorldController.FORWARD_ROT.vadd(this.currentPlayer.rigidBody.position);
	this.camera.position.z = 20;
	this.camera.position.y -= 18;
	
	this.currentPlayer.rigidBody.position.copy(this.playerLight.position);
	this.playerLight.position.z += 0.6;
	
	var rotation = new THREE.Quaternion();
	
	this.currentPlayer.rigidBody.quaternion.copy(rotation);
	
	var direction = new THREE.Vector3(0, 20, 0);
	direction.applyQuaternion(rotation);
	
	this.playerLight.target.position.addVectors(this.currentPlayer.rigidBody.position, direction);
}

WorldController.prototype.update = function(dt) {
	this.worldState.update(dt);
	
	this.playerGeometryController.update();
	
	this.updateCurrentPlayer();
	
	//console.log(this.currentPlayer.position.x);
}

WorldController.prototype.render = function(renderer) {
	renderer.clear();
	renderer.render(this.scene, this.camera);
	
	/*if (this.sceneHUD) {
		renderer.clearDepth();
		renderer.render(this.sceneHUD, this.cameraOrtho);
	} else {
		this.createInterface();
	}*/
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
				//console.log("FAST ");
				if(action) this.currentPlayer.isRunning = true;
				else this.currentPlayer.isRunning = false;
			break;
		}
	
	//}
}