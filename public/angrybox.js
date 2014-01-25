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
	assets: {},
	
	loadAssets: function(callback) {
		var loader = new THREE.JSONLoader();
		
		loader.onLoadComplete = callback;
		
		loader.load("models/crate/crate.js", function(geometry, materials) {
			var faceMaterial = new THREE.MeshFaceMaterial(materials);
			//var faceMaterial = new THREE.MeshPhongMaterial(materials);
			//var faceMaterial = new THREE.MeshNormalMaterial()
			
			AngryBox.assets.crate = new THREE.Mesh(geometry, faceMaterial);
		});
	},
	
	controller: {
		scene: new THREE.Scene(),
		camera: new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000),
		
		setup: function() {
			// Add the test cube:
			var geometry = new THREE.CubeGeometry(1,1,1);
			var material = new THREE.MeshBasicMaterial({color: 0x00ff00});

			this.cube = new THREE.Mesh(geometry, material);
			this.scene.add(this.cube);
		
			this.camera.position.z = 5;
		},
		
		update: function(timestep) {
			console.log("update", timestep);
		},
		
		handleEvent: function(event, state) {
			console.log("handleEvent", event, state);
			
			switch(event) {
			case Event.MOVE_FORWARDS:
				this.cube.position.x -= 1; break;
			case Event.MOVE_BACKWARDS:
				this.cube.position.x += 1; break;
			}
		},
		
		render: function(renderer) {
			this.cube.rotation.x += 0.1;
			this.cube.rotation.y += 0.1;

			renderer.render(this.scene, this.camera);
		}
	},
	
	setController: function(controller) {
		console.log("Setting controller:", controller);
		
		this.controller = controller;
		
		controller.setup("Angry Player", new CANNON.Vec3(0,0,0));
	},
	
	run: function(controller) {
		if (controller) this.setController(controller);
		else this.setController(this.controller);
		
		// Setup keyboard bindings:
		window.addEventListener('keydown', this.handleUserInput.bind(this, true), false);
		window.addEventListener('keyup', this.handleUserInput.bind(this, false), false);
		window.addEventListener('resize', this.resizeWindow.bind(this), false);
		
		this.renderer = new THREE.WebGLRenderer();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		this.timestep = 1.0/60.0;
		this.timer = setInterval(this.update.bind(this), this.timestep);

		this.render();
	},

	render: function() {
		requestAnimationFrame(this.render.bind(this));

		this.controller.render(this.renderer);
	},
	
	update: function() {
		this.controller.update(this.timestep);
	},
	
	eventState: {
	},
	
	handleEvent: function(event, state) {
		if (state) {
			if (this.eventState[event] == state) return;
			
			this.eventState[event] = state;
			
			this.controller.handleEvent(event, state);
		} else {
			delete this.eventState[event];
			
			this.controller.handleEvent(event, state)
		}
	},
	
	handleUserInput: function(state, e) {
		switch (e.charCode ? e.charCode : e.keyCode) {
		case 87: // w
			this.handleEvent(Event.MOVE_FORWARDS, state); break;
		case 83: // s
			this.handleEvent(Event.MOVE_BACKWARDS, state); break;
		case 65: // a
			this.handleEvent(Event.ROTATE_LEFT, state); break;
		case 68: // d
			this.handleEvent(Event.ROTATE_RIGHT, state); break;
		case 81: // q
			this.handleEvent(Event.STRAFE_LEFT, state); break;
		case 69: // e
			this.handleEvent(Event.STRAFE_RIGHT, state); break;
		case 32: // spacebar
			this.handleEvent(Event.SHOOT, state); break;
		default:
			return;
		}
		
		e.stopPropagation();
	},
	
	resizeWindow: function(e) {
		console.log("Resize window:", e)
	},
};
