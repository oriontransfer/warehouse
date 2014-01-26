
function Container () {
	this.values = {};
	this.observers = [];
	this.length = 0;
}

Container.prototype.push = function(object) {
	this.add(object.ID, object);
}

Container.prototype.pop = function(object) {
	this.remove(object.ID, object);
}

Container.prototype.add = function(key, object) {
	if (key in this.values) {
		console.log("Warning, object already in container", key, object);
		return;
	}
	
	this.values[key] = object;
	this.length += 1;
	
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
	this.length -= 1;
}

Container.prototype.forEach = function(callback) {
	for (var key in this.values) {
		callback(this.values[key]);
	}
}

Container.prototype.contains = function(key) {
	return key in this.values;
}
