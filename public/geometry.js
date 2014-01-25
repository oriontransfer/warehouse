
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
	var rigidbody = object.rigidbody;
	var h = rigidBody.halfExtents;
	
	var geometry = new THREE.CubeGeometry(h.x * 2.0, h.y * 2.0, h.z * 2.0);
	
	console.log("Adding geometry", geometry);
	
	object.mesh = new THREE.Mesh(geometry, this.shaders.basic);
	
	this.scene.add(object.mesh);
}

GeometryController.prototype.onRemove = function(key, object)
{
	console.log("Removing mesh", object.mesh);
	
	this.scene.remove(object.mesh);
}

GeometryController.prototype.update = function()
{
	var geometry = this.worldState.geometry;
	
	for (var key in geometry) {
		var state = geometry[key];
		var rigidbody = state.rigidbody;
		var mesh = state.mesh;
		
		rigidbody.position.copy(mesh.position);
		rigidbody.quaternion.copy(mesh.quaternion);
	}
}
