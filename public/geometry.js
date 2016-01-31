
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
	var box = Warehouse.assets.get('box');
	box.geometry.computeBoundingBox();
	
	object.mesh = new THREE.Object3D();
	
	var boxMesh = new THREE.Mesh(box.geometry, box.material);
	object.mesh.receiveShadow = true;
	object.mesh.castShadow = true;
	
	// Center the mesh since it's position is based on a physics bounding box which is modelled using half extents:
	boxMesh.position.copy(box.geometry.boundingBox.center().negate());
	
	object.mesh.add(boxMesh);
	
	var shape = object.rigidBody.shapes[0];
	var wireframeMaterial = new THREE.MeshLambertMaterial({color: 0xffffff, wireframe:true});
	var wireframe = new THREE.BoxGeometry(
		shape.halfExtents.x*2,
		shape.halfExtents.y*2,
		shape.halfExtents.z*2
	);
	
	object.mesh.add(new THREE.Mesh(wireframe, wireframeMaterial));
	
	this.scene.add(object.mesh);
}

GeometryController.prototype.onRemove = function(key, object)
{
	this.scene.remove(object.mesh);
}

GeometryController.prototype.update = function()
{
	this.container.forEach(function(object) {
		if (object.mesh) {
			var mesh = object.mesh, rigidBody = object.rigidBody;
			
			// Center
			mesh.position.copy(rigidBody.position);
			mesh.quaternion.set(
				rigidBody.quaternion.x,
				rigidBody.quaternion.y,
				rigidBody.quaternion.z,
				rigidBody.quaternion.w
			);
		}
	});
}

function FloorController (scene, size)
{
	this.scene = scene;
	this.size = size;
	
	this.random = new RandomGenerator(612351234);
	
	this.tiles = [
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-flat'),
		Warehouse.assets.get('floor-cracked')
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

function FloorRenderer (scene){
 
}

function WallRenderer (scene, size){
	this.scene = scene;
	this.tiles = [
		Warehouse.assets.get('wall-corner'),
		Warehouse.assets.get('wall-window'),
		Warehouse.assets.get('wall-supported')
	];
	
	this.random = new RandomGenerator(612351235);
	this.size = size;
}

WallRenderer.prototype.generate = function(){
	
	
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

WallRenderer.prototype.add = function(mesh){
	mesh.receiveShadow = true;
	this.scene.add(mesh);
}


function WallController(size, worldState){
	this.size = size;
	this.renderer = null;
	this.worldState = worldState;
	
} 

WallController.prototype.generate = function(){
	var size = this.size;
	//this.worldState.addBoxGeometry(new CANNON.Vec3(-5,size[1]*4,0), new CANNON.Vec3(1,size[1]*4+4,100), 0, "");//left
	//this.worldState.addBoxGeometry(new CANNON.Vec3(size[0]*8-3,size[1]*4,0), new CANNON.Vec3(1,size[1]*4+4,100), 0, "");//right
	//this.worldState.addBoxGeometry(new CANNON.Vec3(size[0]*4,size[1]*8-3,0), new CANNON.Vec3(size[0]*8,1,100), 0, "");//up
	//this.worldState.addBoxGeometry(new CANNON.Vec3(size[0]*4,-5,0), new CANNON.Vec3(size[0]*8,1,100), 0, "");//down
	
	//Initialise the ground plane
	this.worldState.addPlaneGeometry(new CANNON.Vec3(-4, 0, 0), new CANNON.Vec3(0,1,0), Math.PI/2); //Left
	this.worldState.addPlaneGeometry(new CANNON.Vec3(0, -4, 0), new CANNON.Vec3(-1,0,0), Math.PI/2); //Down
	this.worldState.addPlaneGeometry(new CANNON.Vec3(0, size[1]*8 - 4, 0), new CANNON.Vec3(1,0,0), Math.PI/2); //Up
	this.worldState.addPlaneGeometry(new CANNON.Vec3(size[0]*8 - 4, 0, 0), new CANNON.Vec3(0,-1,0), Math.PI/2); //Up
	
	if(this.renderer){
		this.renderer.generate();
	}
	
}
