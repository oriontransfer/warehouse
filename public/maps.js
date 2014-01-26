
function GameMap(worldState)
{
	this.worldState = worldState;
}

GameMap.prototype.spawn = function()
{
}

AngryBoxMaps = [];

AngryBoxMaps.push({
	name: 'The Warehouse',
	
	create: function(worldState, rendererState) {
		var map = new GameMap(worldState);
		
		var size = [32, 12], seed = 801923458, spawnY = 0;
		
		map.spawn = function(playerState) {
			spawnY = (spawnY + 1) % size[1];
			
			return this.worldState.createPlayer(new CANNON.Vec3(5, spawnY * 4, 10));
		}
		
		if (rendererState) {
			// Generate floor:
			map.floorController = new FloorController(rendererState.scene, size);
			map.floorController.generate();
			
			// Generate walls:
			map.wallController = new WallController(rendererState.scene, size);
			map.wallController.generate();
		}
		
		// Generate shelves:
		var region = [new CANNON.Vec3(2,2,0), new CANNON.Vec3(size[0]*8, size[1]*8, 0)], density = 0.5;
		
		map.shelvesController = new ShelvesController(seed, region, density, worldState);

		if (rendererState)
			map.shelvesController.renderer = rendererState.shelvesRenderer;
		
		map.shelvesController.generateHorizontalLines();
		
		// Bounding planes for walls:
		map.worldState.addBoxGeometry(new CANNON.Vec3(-5,size[1]*4,0), new CANNON.Vec3(1,size[1]*4+4,100), 0, "");//left
		map.worldState.addBoxGeometry(new CANNON.Vec3(size[0]*8-3,size[1]*4,0), new CANNON.Vec3(1,size[1]*4+4,100), 0, "");//right
		map.worldState.addBoxGeometry(new CANNON.Vec3(size[0]*4,size[1]*8-3,0), new CANNON.Vec3(size[0]*8,1,100), 0, "");//up
		map.worldState.addBoxGeometry(new CANNON.Vec3(size[0]*4,-5,0), new CANNON.Vec3(size[0]*8,1,100), 0, "");//down
		
		return map;
	}
});