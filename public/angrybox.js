
AngryBox = {
	assets: new ResourceLoader(),
	
	loadAssets: function(callback) {
		var loader = new THREE.JSONLoader();
		
		var loadModelCompleted = function(name, completeLoad) {
			loader.load("models/" + name + "/model.js", function(geometry, materials) {
				var faceMaterial = new THREE.MeshFaceMaterial(materials);
			
				completeLoad({geometry: geometry, material: faceMaterial});
			});
		};
		
		// ** Box **
		
		this.boxes = ['box', 'crate'];
		this.assets.loadAll(this.boxes, loadModelCompleted);
		
		// ** Floor **
		
		this.tiles = ['floor-cracked', 'floor-flat'];
		this.assets.loadAll(this.tiles, loadModelCompleted);
		
		// ** Walls **
		
		this.walls = ['wall-corner', 'wall-window', 'wall-supported'];
		this.assets.loadAll(this.walls, loadModelCompleted);
		
		// ** Shelves **
		
		this.shelves = ['shelf-long-boxes', 'shelf-long-crates', 'shelf-long-barrels'];
		this.assets.loadAll(this.shelves, loadModelCompleted);
		
		// ** Barrels **
		
		this.barrels = ['barrel-blue', 'barrel-red'];
		this.assets.loadAll(this.barrels, loadModelCompleted);
		
		this.assets.loaded(callback);
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
		
		controller.setup(this.renderer);
	},
	
	run: function(controller) {
		this.eventState[Event.FAST] = false;
		
		// Setup keyboard bindings:
		window.addEventListener('keydown', this.handleUserInput.bind(this, true), false);
		window.addEventListener('keyup', this.handleUserInput.bind(this, false), false);
		window.addEventListener('resize', this.resizeWindow.bind(this), false);
		
		this.renderer = new THREE.WebGLRenderer({antialias: true});
		
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);
		
		if (controller) this.setController(controller);
		else this.setController(this.controller);
		
		this.timestep = 1.0/30.0;
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
	
	serverUpdate: function(data) {
		this.controller.serverUpdate(data);
	},
	
	eventState: {
	},
	
	connectToServer: function(host) {
		this.socket = io.connect(host);
		
		this.socket.emit('register', {name: 'Box Killer'});
		
		this.socket.on('update', function(data) {
			this.serverUpdate(data);
		}.bind(this));
	},
	
	handleEvent: function(event, state) {
		if (state) {
			if (this.eventState[event] == state) return;
			
			this.eventState[event] = state;
			
			this.controller.handleEvent(event, state);
			this.socket.emit('event', {event: event, state: state});
		} else {
			if (this.eventState[event] == state) return;
			
			delete this.eventState[event];
			
			this.controller.handleEvent(event, state)
			this.socket.emit('event', {event: event, state: state});
		}
	},
	
	handleUserInput: function(state, e) {
		if (e.shiftKey) {
			this.handleEvent(Event.FAST, true);
		} else {
			this.handleEvent(Event.FAST, false);
		}
		
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
		console.log("Resize window:", e);
		
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		
		this.controller.resizeWindow(window.innerWidth, window.innerHeight);
	},
};
