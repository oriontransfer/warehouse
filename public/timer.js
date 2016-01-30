
// All time is in milliseconds
function Timer (callback, interval) {
	this.interval = interval;
	this.callback = callback;
	
	this.error = 1.0;
	
	this.running = false;
}

Timer.currentTime = function() {
	return (new Date()).getTime();
}

Timer.prototype.start = function() {
	this.running = true;
	
	this.lastTime = Timer.currentTime();
	this._dispatch();
}

Timer.prototype._dispatch = function() {
	var nextTime = this.lastTime + this.interval;
	
	var duration = nextTime - Timer.currentTime();
	
	//console.log("timer error:", this.error, "duration:", duration);
	
	while (duration < 0) {
		// Dropping frames:
		this.lastTime = Timer.currentTime();
		
		duration = 0;
	}
	
	setTimeout(
		this.update.bind(this),
		duration * this.error
	);
}

Timer.prototype.stop = function() {
	this.running = false;
}

Timer.prototype.update = function() {
	if (!this.running) return;
	
	var currentTime = Timer.currentTime();
	var elapsedTime = (currentTime - this.lastTime);
	
	var offset = elapsedTime - this.interval;
	
	// If offset is +ve, we are running too slowly
	if (offset >= 0) {
		this.callback();
		
		// If too fast, error should be +ve.
		// If too slow, error should be -ve.
		
		if (offset > 1) {
			this.error *= 0.9;
		}
		
		this.lastTime += this.interval;
	}
	
	// Too slow, wait a bit longer
	if (offset < -1)
		this.error *= 1.1;
	
	if (this.running)
		this._dispatch();
}
