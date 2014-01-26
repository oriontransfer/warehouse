
Warehouse = {
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
		
		// ** Notifications **
		
		this.notifications = ['notify-footstep', 'notify-gunshot'];
		this.assets.loadAll(this.notifications, loadModelCompleted);
		
		this.assets.loaded(callback);
	},
	
	controller: {
		setup: function() {
		},
		
		update: function(timestep) {
		},
		
		handleEvent: function(event, state) {
		},
		
		render: function(renderer) {
		},
		serverUpdate: function(data) {
			if (data.phase == "preparing") {
				var mapTemplate = WarehouseMaps[data.map];
				
				// Replace the controller with local world controller for the specified map:
				Warehouse.setController(new WorldController(mapTemplate));
			}
		},
		resizeWindow: function(width, height) {
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
		
		var options = {};
		//options.antialias = true;
		//options.precision = 'highp';
		
		this.renderer = new THREE.WebGLRenderer(options);
		
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);
		
		if (controller) this.setController(controller);
		else this.setController(this.controller);
		
		this.timestep = 1.0/30.0;
		this.timer = new Timer(this.update.bind(this), this.timestep * 1000.0);
		this.timer.start();
		
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
	
	connectToServer: function(host) {
		this.socket = io.connect(host);
		
		this.socket.emit('register', {name: 'Box Killer'});
		
		this.socket.on('update', function(data) {
			this.controller.serverUpdate(data);
		}.bind(this));
		
		this.socket.on('spawn', function(data) {
			this.controller.serverSpawned(data);
		}.bind(this));
		
		// Messages from server:
		this.socket.on('message', function(data) {
			var messageElement = document.createElement('div');
			
			if (data.html) {
				messageElement.innerHTML = data.text;
			} else {
				var messageTextNode = document.createTextNode(data.text);
				messageElement.appendChild(messageTextNode);
			}
			
			this.messagesElement.appendChild(messageElement);
			
			// Only show 4 most recent messages:
			while (this.messagesElement.children.length > 4) {
				this.messagesElement.removeChild(this.messagesElement.children[0]);
			}
		}.bind(this));
		
		this.socket.on('timeout', function(data) {
			this.timeoutElement.textContent = Math.floor(data.remaining) + 's';
		}.bind(this));
	},
	
	handleEvent: function(event, state) {
		if (state) {
			if (this.eventState[event] == state) return;
			
			this.eventState[event] = state;
			
			this.socket.emit('event', {event: event, state: state});
			this.controller.handleEvent(event, state);
		} else {
			if (this.eventState[event] == state) return;
			
			delete this.eventState[event];
			
			this.socket.emit('event', {event: event, state: state});
			this.controller.handleEvent(event, state)
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
