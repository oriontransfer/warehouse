
function MapController ()
{
}

MapController.prototype.reset = function()
{
}

MapController.prototype.loadMap = function(name)
{
	this.reset();
	
	var mapTemplate = WarehouseMaps[name];
	
	if (this.map) {
		this.map.deallocate();
	}
	
	this.map = mapTemplate.create(this);
}

MapController.maps = {}

MapController.add = function(mapTemplate) {
	MapController.maps[mapTemplate.name] = mapTemplate;
}

function GameMap(name, worldState)
{
	this.name = name;
	this.worldState = worldState;
}

GameMap.prototype.spawn = function()
{
}

GameMap.prototype.deallocate = function()
{
}

MapController.add({
	name: 'The Warehouse',
	
	create: function(mapController) {
		var worldState = mapController.worldState, rendererState = mapController.rendererState;
		
		var map = new GameMap(this.name, worldState);
		worldState.renderState = rendererState;
		
		var size = [32, 12], seed = 801923458, spawnY = 0;
		
		map.spawn = function(playerState) {
			spawnY = (spawnY + 1) % size[1];
			
			return this.worldState.createPlayer(new CANNON.Vec3(0, spawnY * 8, 1.0));
		}
		
		map.wallController = new WallController(size, worldState);
		
		if (rendererState) {
			// Generate floor:
			map.floorController = new FloorController(rendererState.scene, size);
			map.floorController.generate();
			
			// Generate walls:
			map.wallController.renderer = new WallRenderer(rendererState.scene, size);
			
		}
		
		map.wallController.generate();
		// Generate shelves:
		var region = [new CANNON.Vec3(2,2,0), new CANNON.Vec3(size[0]*8, size[1]*8, 0)], density = 0.5;
		
		map.shelvesController = new ShelvesController(seed, region, density, worldState);

		if (rendererState)
			map.shelvesController.renderer = rendererState.shelvesRenderer;
		
		map.shelvesController.generateHorizontalLines();

		map.clutterController = new ClutterController(seed, region, density, worldState);

		if(rendererState){
			map.clutterController.renderer = rendererState.clutterRenderer;
		}

		map.clutterController.GenerateLotsOfClutter();
		
		// Bounding planes for walls;
		
		return map;
	}
});
