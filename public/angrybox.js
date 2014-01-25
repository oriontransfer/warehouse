
// A list of possible user events:
Event = {
	NONE: 0,
	MOVE_FORWARDS: 1,
	MOVE_BACKWARDS: 2,
	ROTATE_LEFT: 3,
	ROTATE_RIGHT: 4,
	STRAFE_LEFT: 5,
	STRAFE_RIGHT: 6,
	SHOOT: 7
};

AngryBox = {
	controller: {
		update: function(timestep) {
			console.log("update", timestep);
		},
		
		handleEvent: function(event) {
			console.log("handleEvent", event);
			
			switch(event) {
			case Event.MOVE_FORWARDS:
				AngryBox.cube.position.x -= 1; break;
			case Event.MOVE_BACKWARDS:
				AngryBox.cube.position.x += 1; break;
			}
		},
	},
	
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),

	run: function() {
		// Setup keyboard bindings:
		window.addEventListener('keydown', this.handleUserInput.bind(this), false);
		window.addEventListener('resize', this.resizeWindow.bind(this), false);
		
		this.renderer = new THREE.WebGLRenderer();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		// Add the test cube:
		var geometry = new THREE.CubeGeometry(1,1,1);
		var material = new THREE.MeshBasicMaterial({color: 0x00ff00});

		this.cube = new THREE.Mesh(geometry, material);
		this.scene.add(this.cube);
		
		this.camera.position.z = 5;

		this.timestep = 1.0/30.0;
		setInterval(this.timestep, this.update.bind(this));

		this.render();
	},

	render: function() {
		requestAnimationFrame(this.render.bind(this));

		this.cube.rotation.x += 0.1;
		this.cube.rotation.y += 0.1;

		this.renderer.render(this.scene, this.camera);
	},
	
	update: function() {
		this.controller.update(this.timestep);
	},
	
	handleEvent: function(event) {
		this.controller.handleEvent(event);
	},
	
	handleUserInput: function(e) {
		switch (e.charCode ? e.charCode : e.keyCode) {
		case 87: // w
			this.handleEvent(Event.MOVE_FORWARDS); break;
		case 83: // s
			this.handleEvent(Event.MOVE_BACKWARDS); break;
		case 65: // a
			this.handleEvent(Event.ROTATE_LEFT); break;
		case 68: // d
			this.handleEvent(Event.ROTATE_RIGHT); break;
		case 81: // q
			this.handleEvent(Event.STRAFE_LEFT); break;
		case 69: // e
			this.handleEvent(Event.STRAFE_RIGHT); break;
		case 32: // spacebar
			this.handleEvent(Event.SHOOT); break;
		default:
			return;
		}
		
		event.stopPropagation();
	},
	
	resizeWindow: function(e) {
		console.log("Resize window:", e)
	},
};
