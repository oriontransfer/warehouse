
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

function ShelvesRenderer(rendererState)
{
	this.assets = rendererState.assets;
	this.scene = rendererState.scene;
	
	this.shelves = [
		this.assets.get('shelf-long-boxes'),
		this.assets.get('shelf-long-crates'),
		this.assets.get('shelf-long-barrels'),
		this.assets.get('barrel-blue'),
		this.assets.get('barrel-red')
	]
}

ShelvesRenderer.prototype.add = function(assetIndex, pos_x, pos_y, angle)
{
	var shelve = this.shelves[assetIndex];
	
	var mesh = new THREE.Mesh(shelve.geometry, shelve.material);
	mesh.castShadow    = true;
	mesh.receiveShadow = true;
	mesh.position.x = pos_x;
	mesh.position.y = pos_y;
	mesh.rotateOnAxis(new THREE.Vector3(0, 0, 1), D2R(angle));
	
	// Create mesh for shelf
	this.scene.add(mesh);
}

function ShelvesController(seed, region, density, worldState, renderer)
{
	this.random = new RandomGenerator(seed);
	
	this.worldState = worldState;
	this.renderer = renderer;
	
	this.region = region;
	this.density = density;
	
	this.shelve_size = 8;
	this.grid_width  = Math.floor( (this.region[1].x - this.region[0].x)/this.shelve_size );
	this.grid_height = Math.floor( (this.region[1].y - this.region[0].y)/this.shelve_size );
}

ShelvesController.AssetIndices = [0, 1, 0, 2, 0, 0, 3, 2, 0, 1, 0, 3, 4, 0, 4, 0];

ShelvesController.prototype.generateShelveAtPosition = function(pos_x, pos_y, angle, type_of_shelve)
{
	var assetIndex = ShelvesController.AssetIndices[type_of_shelve];
	
	if (this.renderer)
		this.renderer.add(assetIndex, pos_x, pos_y, angle);
	
	var position = new CANNON.Vec3(pos_x, pos_y, 0);
	
	var boxsize = (angle == 270 || angle == 0 ? new CANNON.Vec3(this.shelve_size/2,this.shelve_size/3,100) : new CANNON.Vec3(this.shelve_size/3,this.shelve_size/2,100) );
	var mass = (assetIndex == 3 || assetIndex == 4) ? 2000 : 0;
	
	this.worldState.addBoxGeometry(position, boxsize, mass, "");
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
		for(var j=start_idx_x; j<end_idx_x; j++){
			if(j>half_x-2 && j <half_x+1) continue;
			
			this.generateShelveAtPosition(this.region[0].x + j*this.shelve_size, this.region[0].y + i*dy*this.shelve_size, 270 ,this.random.nextInteger(5));
		}
	}
}

function ClutterController(seed, region, density, worldState, renderer){
	this.random = new RandomGenerator(seed);
	this.worldState = worldState;
	this.renderer = renderer;
	
	this.region = region;
	this.density = density;
}

ClutterController.prototype.add = function(position, type){

	if(this.renderer){
		this.renderer.add(position, type); //Add to the clutter renderer
	}

	var boxsize = new CANNON.Vec3(1,1,1);

	this.worldState.addBoxGeometry(position, boxsize, 1700, "", true);
}

ClutterController.REGION_DIVISION_SIZE = 1.0;
ClutterController.prototype.GenerateLotsOfClutter = function(){ //Randomly generate some clutter with densities defined by overlapping sine functions.

	var numAdded = 0;

	var horzDivisions = this.region[1].x/ClutterController.REGION_DIVISION_SIZE;
	var vertDivisions = this.region[1].y/ClutterController.REGION_DIVISION_SIZE;

	var sinStartHorz1 = this.random.nextNumber();
	var sinStartVert1 = this.random.nextNumber();
	var sinStartHorz2 = this.random.nextNumber();
	var sinStartVert2 = this.random.nextNumber();

	for(var i = 0; i < horzDivisions; i++){
		var horzProb1 = Math.sin(i/this.region[0].x + sinStartHorz1);
		var horzProb2 = Math.sin(i/this.region[0].x + sinStartHorz2);
		var horzProb = (horzProb1 + horzProb2)/2.0 * 0.1;
		for(var j = 0; j < vertDivisions; j++){
			var vertProb1 = Math.sin(j/this.region[0].y + sinStartVert1);
			var vertProb2 = Math.sin(j/this.region[0].y + sinStartVert2);
			var vertProb = (vertProb1 + vertProb2)/2.0 * 0.1;

			if(this.random.nextNumber() < horzProb && this.random.nextNumber() < vertProb){
				var position = new CANNON.Vec3(0,0,0);
				var type = [];

				position.x = i * ClutterController.REGION_DIVISION_SIZE;
				position.y = j * ClutterController.REGION_DIVISION_SIZE;
				position.z = 0;

				var type = this.random.nextNumber() * 4;
				numAdded++; 
				this.add(position, type);
			}
		}
	}	
	console.log(numAdded, 'added objects');
}

function ClutterRenderer(rendererState){
	this.assets = rendererState.assets;
	this.scene = rendererState.scene;

	this.clutter = [
		this.assets.get('barrel-red'),
		this.assets.get('barrel-blue'),
		this.assets.get('box'),
		this.assets.get('crate'),
	]

	this.clutterMeshes = [];
}

ClutterRenderer.prototype.add = function(position, typeofclutter){
	var clutter = this.clutter[Math.floor(typeofclutter)];

	var newMesh = new THREE.Mesh(clutter.geometry, clutter.material);

	newMesh.castShadow    = true;
	newMesh.receiveShadow = true;

	newMesh.position.x = position.x;
	newMesh.position.y = position.y;
	newMesh.position.z = position.z;

	this.scene.add(newMesh);
}
