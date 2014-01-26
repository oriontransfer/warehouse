function NotificationController(worldState, currentPlayer, scene){
	this.worldState = worldState;
	this.currentPlayer = currentPlayer;
	this.scene = scene;

	this.notifications = {};

	this.assetFootStep = AngryBox.assets.get('notify-footstep');
	this.assetGunShot = AngryBox.assets.get('notify-gunshot');
	this.assetFootStep.material.materials[0].transparent = true;
	this.assetFootStep.material.materials[0].depthWrite = false
	this.assetFootStep.material.materials[0].depthTest = false;
	//this.assetFootStep.material.materials[0].shading = THREE.NoShading;
	this.assetFootStep.material.materials[0].emissive.b = 1.0;
	this.assetFootStep.material.materials[0].emissive.g = 1.0;
	this.assetFootStep.material.materials[0].emissive.r = 1.0;
	this.assetGunShot.material.materials[0].transparent = true;
	this.assetGunShot.material.materials[0].depthWrite = false;
	this.assetGunShot.material.materials[0].depthTest = false;
	this.assetGunShot.material.materials[0].emissive.b = 1.0;
	this.assetGunShot.material.materials[0].emissive.g = 1.0;
	this.assetGunShot.material.materials[0].emissive.r = 1.0;
	//this.mesh = THREE.Mesh(asset.geometry, asset.material);
}

NotificationController.RADIUS = 10;
NotificationController.ORIGIN = new CANNON.Vec3(0,0,0);

NotificationController.prototype.update = function(dt){
	var currentPlayer = this.currentPlayer;
	var notifications = this.notifications;
	var assetFoorStep = this.assetFootStep;
	var shootingAsset = this.assetGunShot;
	var scene = this.scene;

	this.worldState.players.forEach(function(player){
		if(player != currentPlayer){//player != currentPlayer
			var length = player.position.vsub(currentPlayer.position).distanceTo(NotificationController.ORIGIN);
			if(length <= NotificationController.RADIUS){
				//console.log("player is near", player.ID);
				if(player.isMakingNoise){ //TODO add back in player.isMakingNoise
					//console.log("and that player is making noise", player.ID);
					if(notifications[player.ID]){
						if(!notifications[player.ID].update(dt)){
							notifications[player.ID] = null;
						}
					}
					else{
						var not = new Notification((player.isShooting) ? shootingAsset : assetFoorStep, scene, currentPlayer, player);
						notifications[player.ID] = not;
						if(!not.update(dt)) notifications[player.ID] = null;
					}
				}
			}
			else{
				if(notifications[player.ID]){
					notifications[player.ID].update(Notification.LIFE_TIME + 1); //Kill off the notifications
					notifications[player.ID] = null;
				}
			}
		}
		if(notifications[player.ID]){
			if(!notifications[player.ID].update(dt)){
				notifications[player.ID] = null;
			} //Kill off the notifications

		}
	})
}


function Notification(asset, scene, player, playertarget) {
	//this.mesh = mesh;
	this.currentPlayer = player;
	this.target = playertarget;
	this.timealive = 0;

	this.mesh = new THREE.Mesh(asset.geometry, asset.material);
	this.mesh.castShadow = false;
	this.mesh.receiveShadow = false;

	this.scene = scene;
	this.scene.add(this.mesh);
}

Notification.LIFE_TIME = 1;
Notification.DISTANCE_FROM_PLAYER = 3;
Notification.DIRECTION_VEC = new CANNON.Vec3(0,0,0);
Notification.FORWARD = new CANNON.Vec3(0,1,0);
Notification.ROT = new CANNON.Vec3(0,0,0);
Notification.HEIGHT = 0;

Notification.prototype.update = function(dt) {
	this.timealive += dt;

	if(this.timealive >= Notification.LIFE_TIME){
		this.scene.visible = false;
		this.scene.remove(this.mesh);
		return false;
	}
	else{
		Notification.DIRECTION_VEC = this.target.position.vsub(this.currentPlayer.position);
		Notification.DIRECTION_VEC.normalize();

		notRot = new CANNON.Quaternion(0,0,0,0);
		notRot.setFromVectors(Notification.FORWARD, Notification.DIRECTION_VEC);

		this.mesh.position.x = this.currentPlayer.position.x + Notification.DISTANCE_FROM_PLAYER * Notification.DIRECTION_VEC.x;
		this.mesh.position.y = this.currentPlayer.position.y + Notification.DISTANCE_FROM_PLAYER * Notification.DIRECTION_VEC.y;
		this.mesh.position.z = Notification.HEIGHT;
		this.mesh.quaternion.x = notRot.x;
		this.mesh.quaternion.y = notRot.y;
		this.mesh.quaternion.z = notRot.z;
		this.mesh.quaternion.w = notRot.w;

		this.mesh.scale.x = -1.0;
		this.mesh.scale.y = -1.0;
		this.mesh.scale.z = 1.0;
	}
	return true;
}