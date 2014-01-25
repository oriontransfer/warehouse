
function Container () {
	this.values = {};
	this.observers = [];
}

Container.prototype.add = function(key, object) {
	this.values[key] = object;
	
	this.observers.forEach(function(observer) {
		observer.onAdd(key, object, container);
	});
}

Container.prototype.remove = function(key) {
	var object = this.values[key];
	
	this.observers.forEach(function(observer) {
		observer.onRemove(key, object, container);
	});
	
	delete this.values[key];
}
