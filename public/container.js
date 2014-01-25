
function Container () {
	this.values = {};
	this.observers = [];
}

Container.prototype.push = function(object) {
	this.add(object.ID, object);
}

Container.prototype.pop = function(object) {
	this.remove(object.ID, object);
}

Container.prototype.add = function(key, object) {
	this.values[key] = object;
	
	var container = this;
	
	this.observers.forEach(function(observer) {
		observer.onAdd(key, object, container);
	});
}

Container.prototype.remove = function(key) {
	var object = this.values[key];
	
	var container = this;
	
	this.observers.forEach(function(observer) {
		observer.onRemove(key, object, container);
	});
	
	delete this.values[key];
}
