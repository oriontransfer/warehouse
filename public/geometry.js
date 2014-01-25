
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
	
	object.mesh = new THREE.Mesh(AngryBox.assets.crate.geometry, AngryBox.assets.crate.material);
	object.mesh.useQuaternion = true;
	
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
