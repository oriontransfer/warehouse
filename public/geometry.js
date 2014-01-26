
function RandomGenerator(seed)
{
	this.z = seed;
	this.w = -seed;
}

RandomGenerator.prototype.next = function()
{
	this.z = 36969 * (this.z & 65535) + (this.z >> 16);
	this.w = 18000 * (this.w & 65535) + (this.w >> 16);
	
	return Math.abs((this.z << 16) + this.w);  /* 32-bit result */
}

RandomGenerator.prototype.nextNumber = function()
{
	return this.next() / 0xFFFFFFFF;
}

RandomGenerator.prototype.nextInteger = function(max)
{
	return this.next() % max;
}

function GeometryController (scene, container)
{
	this.scene = scene;
	
	this.container = container;
	this.container.observers.push(this);
	
	this.shaders = {
		basic: new THREE.MeshBasicMaterial({color: 0x00ff00})
	}
}

GeometryController.prototype.onAdd = function(key, object)
{
	var box = AngryBox.assets.get('box');
	
	object.mesh = new THREE.Mesh(box.geometry, box.material);
	object.mesh.receiveShadow = true;
	object.mesh.castShadow = true;
	
	this.scene.add(object.mesh);
}

GeometryController.prototype.onRemove = function(key, object)
{
	console.log("Removing mesh", object.mesh);
	
	this.scene.remove(object.mesh);
}

GeometryController.prototype.update = function()
{
	this.container.forEach(function(object) {
		if (object.mesh) {
			var mesh = object.mesh, rigidBody = object.rigidBody;
		
			rigidBody.position.copy(mesh.position);
			mesh.position.z -= 0.8;
			rigidBody.quaternion.copy(mesh.quaternion);
		}
	});
}

function FloorController (scene, size)
{
	this.scene = scene;
	this.size = size;
	
	this.random = new RandomGenerator(612351234);
	
	this.tiles = [
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-flat'),
		AngryBox.assets.get('floor-cracked')
	];
	
	this.done = false;
}

FloorController.prototype.generate = function()
{
	for (var x = 0; x < this.size[0]; x += 1) {
		for (var y = 0; y < this.size[1]; y += 1) {
			var i = this.random.nextInteger(this.tiles.length), tile = this.tiles[i];
			
			//console.log("tile", i, tile);
			
			var mesh = new THREE.Mesh(tile.geometry, tile.material);
			
			mesh.receiveShadow = true;
			
			mesh.position.x = x * 8;
			mesh.position.y = y * 8;
			
			this.scene.add(mesh);
		}
	}
}

function WallController (scene, size)
{
	this.scene = scene;
	this.size = size;
	
	this.random = new RandomGenerator(612351235);
	
	this.tiles = [
		AngryBox.assets.get('wall-corner'),
		AngryBox.assets.get('wall-window'),
		AngryBox.assets.get('wall-supported')
	];
} 

WallController.prototype.add = function(mesh)
{
	mesh.receiveShadow = true;
	this.scene.add(mesh);
}

WallController.prototype.generate = function()
{
	//CORNERS
	var corner_tile = this.tiles[0];
	var corner_mesh_1 = new THREE.Mesh(corner_tile.geometry, corner_tile.material);
	corner_mesh_1.position.x = (this.size[0]+1)*8 - 8 ;
	corner_mesh_1.position.y = (this.size[1]-1)*8 + 8;	
	corner_mesh_1.rotateOnAxis((new THREE.Vector3(0, 0, 1)).normalize(), D2R(270));		
	this.scene.add(corner_mesh_1);
	
	var corner_mesh_2 = new THREE.Mesh(corner_tile.geometry, corner_tile.material);
	corner_mesh_2.position.x = - 8 ;
	corner_mesh_2.position.y = (this.size[1]-1)*8 + 8;		
	this.add(corner_mesh_2);
		
	//WALLS
	for(var x = 1; x<this.size[0]+1; x+=1){
		var rand = this.random.nextInteger(2)%2 + 1;
		var tile = this.tiles[rand];
		var mesh = new THREE.Mesh(tile.geometry, tile.material);
		mesh.position.x = x * 8 - 8 ;
		mesh.position.y = (this.size[1]-1)*8 + 8;		
		this.add(mesh);
	}
		
	for(var y = 0; y<this.size[1]; y+=1){
		//LEFT
		var rand = this.random.nextInteger(2)%2 + 1;
		var tile =  this.tiles[rand] ;
		var mesh = new THREE.Mesh(tile.geometry, tile.material);
		mesh.position.x = - 8;
		mesh.position.y = y * 8 ;	
		mesh.rotateOnAxis((new THREE.Vector3(0, 0, 1)).normalize(), D2R(90));
		this.add(mesh);
		
		//RIGHT
		rand = this.random.nextInteger(2)%2 + 1;
		tile =  this.tiles[rand] ;
		mesh = new THREE.Mesh(tile.geometry, tile.material);
		mesh.position.x = (this.size[0]+1)*8 - 8;
		mesh.position.y = y * 8 ;	
		mesh.rotateOnAxis((new THREE.Vector3(0, 0, 1)).normalize(), D2R(270));
		this.add(mesh);
	}
	
}


function ShelvesController (scene, region, density, worldState)
{
	this.scene 		= scene;
	this.region 	= region;
	this.worldState = worldState;
	this.density 	= density;
	this.random 	= new RandomGenerator(612351232);
	
	this.shelves_assets = [
		AngryBox.assets.get('shelf-long-boxes'),
		AngryBox.assets.get('shelf-long-crates'),
		AngryBox.assets.get('shelf-long-barrels'),
		AngryBox.assets.get('barrel-blue'),
		AngryBox.assets.get('barrel-red')
	];
	
	this.shelves = [
		0,
		1,
		0,
		2,
		0,
		0,
		3,
		2,
		0,
		1,
		0,
		3,
		4,
		0,
		4,
		0,
	];		
	
	this.shelve_size = 8;
	this.grid_width  = Math.floor( (this.region[1].x - this.region[0].x)/this.shelve_size );
	this.grid_height = Math.floor( (this.region[1].y - this.region[0].y)/this.shelve_size );
}

ShelvesController.prototype.generateShelveAtPosition = function(pos_x, pos_y, rot_vec, angle, type_of_shelve){
	var shelve =  this.shelves_assets[this.shelves[type_of_shelve]];
	var mesh = new THREE.Mesh(shelve.geometry, shelve.material);
	mesh.castShadow    = true;
	mesh.receiveShadow = true;
	mesh.position.x = pos_x;
	mesh.position.y = pos_y;
	mesh.rotateOnAxis(rot_vec, D2R(angle));
	var boxsize = (angle == 270 || angle == 0 ? new CANNON.Vec3(this.shelve_size/2,this.shelve_size/3,100) : new CANNON.Vec3(this.shelve_size/3,this.shelve_size/2,100) );
	var mass =  this.shelves[type_of_shelve] == 3 || this.shelves[type_of_shelve] == 4 ? 0  : 0;
	this.worldState.addBoxGeometry(new CANNON.Vec3(mesh.position.x,mesh.position.y,0),boxsize, mass, "");
	this.scene.add(mesh);
}

ShelvesController.prototype.generateSingleHorizontalLine = function(from_x, to_x, y){
	for(var j=from_x; j<to_x; j++){
		this.generateShelveAtPosition(j*this.shelve_size, y*this.shelve_size, (new THREE.Vector3(0, 0, 1)).normalize(), 270,this.random.nextInteger(10000)%this.shelves.length);
	}
}

ShelvesController.prototype.generateHorizontalLines = function()
{	
	var n_shelve_lines_max = this.grid_height/2;
	var n_shelve_lines_min = 1;
	var n_shelve_lines     = Math.floor( n_shelve_lines_max*this.density + n_shelve_lines_min*(1-this.density) );
	var start_idx_x        = 2;
	var end_idx_x		   = this.grid_width - 2;
	var half_x 			   = (end_idx_x - start_idx_x)/2
	var dy 				   = Math.floor(this.grid_height / n_shelve_lines); 
	
	for(var i=1; i<=n_shelve_lines; i++){
		var shelve =  this.shelves[0];
		for(var j=start_idx_x; j<end_idx_x; j++){
			if(j>half_x-2 && j <half_x+1) continue;
			
			this.generateShelveAtPosition(this.region[0].x + j*this.shelve_size, this.region[0].y + i*dy*this.shelve_size, (new THREE.Vector3(0, 0, 1)).normalize(), 270,this.random.nextInteger(10000)%this.shelves.length);
		}
	}
}
