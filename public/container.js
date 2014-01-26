
function Container () {
	this.values = {};
	this.observers = [];
	this.length = 0;
}

Container.prototype.onAdd = function(object) {
}

Container.prototype.onRemove = function(object) {
}

Container.prototype.push = function(object) {
	this.add(object.ID, object);
}

Container.prototype.pop = function(object) {
	this.remove(object.ID, object);
}

Container.prototype.add = function(key, object) {
	if (key in this.values) {
		console.log("Warning, object already in container", key);
		return;
	}
	
	this.values[key] = object;
	this.length += 1;
	
	var container = this;
	
	this.observers.forEach(function(observer) {
		observer.onAdd(key, object, container);
	});
	
	this.onAdd(object);
}

Container.prototype.remove = function(key) {
	var object = this.values[key];
	
	var container = this;
	
	this.observers.forEach(function(observer) {
		observer.onRemove(key, object, container);
	});
	
	delete this.values[key];
	this.length -= 1;
	
	this.onRemove(object);
}

Container.prototype.forEach = function(callback) {
	for (var key in this.values) {
		callback(this.values[key]);
	}
}

Container.prototype.contains = function(key) {
	return this.values.hasOwnProperty(key);
}

Container.prototype.serializeObject = function(object) {
	return object;
}

Container.prototype.serialize = function() {
	var data = {};
	
	for (var key in this.values) {
		data[key] = this.serializeObject(this.values[key]);
	}
	
	return data;
}

Container.prototype.deserialize = function(data, callback) {
	// Create and synchronise new data:
	for (var key in data) {
		if (key in this.values) {
			this.deserializeObject(this.values[key], key, data[key]);
		} else {
			this.push(this.createObject(key, data[key]));
		}
	}
	
	// Remove any objects that no longer exist:
	for (var key in this.values) {
		if (!key in data) {
			this.remove(key);
		}
	}
}

Container.prototype.deserializeObject = function(object, key, data) {
	return data;
}

Container.prototype.createObject = function(key, data) {
	return data;
}

Container.prototype.clear = function() {
	for (var key in this.values) {
		this.remove(key);
	}
}

Container.createObjectContainer = function (createObjectCallback) {
	var container = new Container();
	
	container.deserializeObject = function(object, key, data) {
		object.deserialize(data);
	}
	
	container.serializeObject = function(object) {
		return object.serialize();
	}
	
	container.createObject = createObjectCallback;
	
	return container;
}
