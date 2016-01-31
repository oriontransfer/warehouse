
function MapController ()
{
	this.map = null;
}

MapController.prototype.loadMap = function(name, options)
{
	if (this.map) {
		this.map.deallocate();
		this.map = null;
	}
	
	options = options || {}
	
	console.log("Loading map", name, options);
	
	var mapTemplate = MapController.maps[name];
	
	this.map = mapTemplate.create(this, name, options);
	
	return this.map;
}

MapController.maps = {}

MapController.add = function(mapTemplate) {
	MapController.maps[mapTemplate.name] = mapTemplate;
}

function GameMap(name, mapController)
{
	this.name = name;
	this.title = name;
	this.worldState = new WorldState();
}

GameMap.prototype.spawn = function()
{
}

GameMap.prototype.deallocate = function()
{
	// Doesn't exist yet, but I think we need it to avoid memory leaks.
	//this.worldState.deallocate();
}

MapController.add({
	name: 'warehouse',
	
	create: function(mapController, name, options) {
		var map = new GameMap(this.name, mapController);
		var rendererState = options.rendererState;
		var worldState = map.worldState;
		
		var size = [32, 12], seed = 801923458, spawnY = 0;
		
		map.title = "The Warehouse";
		
		map.spawn = function(playerState) {
			spawnY = (spawnY + 1) % size[1];
			
			return this.worldState.createPlayer(new CANNON.Vec3(0, spawnY * 8, 5.0));
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
