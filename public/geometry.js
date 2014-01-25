
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
	var rigidBody = object.rigidBody;
	var h = rigidBody.shape.halfExtents;
	
	var box = AngryBox.assets.get('box');
	object.mesh = new THREE.Mesh(box.geometry, box.material);
	
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
		var mesh = object.mesh, rigidBody = object.rigidBody;
		
		rigidBody.position.copy(mesh.position);
		rigidBody.quaternion.copy(mesh.quaternion);
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
			
			console.log("tile", i, tile);
			
			var mesh = new THREE.Mesh(tile.geometry, tile.material);
			
			mesh.position.x = x * 8;
			mesh.position.y = y * 8;
			
			this.scene.add(mesh);
		}
	}
}
