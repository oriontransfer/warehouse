

function VisibilityController(player, worldState) {
	this.playerBody = player.rigidbody;
	this.worldState = worldState;
	
	// this.worldState.world.bodies
	// -> [CANNON.RigidBody, CANNON.RigidBody]
	// this.currentPlayer.rigidBody.shape
	// CANNON.Box {type: 4, aabbmin: CANNON.Vec3, aabbmax: CANNON.Vec3, boundingSphereRadius: 0.692820323027551, boundingSphereRadiusNeedsUpdate: false…}
}

 VisibilityController.prototype.update = function(){
 	// RD: Todo: add visibility controller
	
 	// this.currentPlayer.rigidBody.position
	// this.currentPlayer.rigidBody.quaternion
	
	//console.log("VISIBILITY UPDATE ON PROGRESS!");
 }





// //if F(a, b, point) > tol, point is "above" the line (a,b) 
// //if F(a, b, point) < tol, point is "below" the line (a,b)
// //otherwise, point is ON the line (a,b). 
// //tol = 0.0000001
// //source = http://stackoverflow.com/questions/99353/how-to-test-if-a-line-segment-intersects-an-axis-aligned-rectange-in-2d
// function pointLineRelationFunction(point_a, point_b, point){
	// return (point_b.y - point_a.y)*point.x + (point_a.x - point_b.x)*point.y + (point_b.x*point_a.y + point_a.x*point_b.y);
// }


// //---------------------------------------------------------------------------------------


// //---- Box class
// function Box (topleft, bottomleft, topright, bottomright) {
	// this.topleft 		= topleft;
	// this.bottomleft 	= bottomleft;
	// this.topright 		= topright;
	// this.bottomright 	= bottomright;
// };

// //check if the point is inside the box
// //point is a Vec2 
// Box.prototype.pointInBox = function(point) {
	// return (point.x>this.min.x && point.x<this.min.x+this.max.x  && point.y>this.min.y && point.y>this.min.y + this.max.y);
// }

// //check if  other_box is inside the box, by checking that all four vertices of other_box are inside the box
// Box.prototype.boxInBox = function(other_box){
	// return ( this.pointInBox(other_box.min              ) && 
	         // this.pointInBox(other_box.getTopLeft()     ) &&	 
	         // this.pointInBox(other_box.getBottomRight() ) && 
			 // this.pointInBox(other_box.getTopRight()    );
// }


// // check if all the vertices of the box are on the same side of the line defined by point_a, point_b,
// // uses pointLineRelationFunction function with a side_sgn positive or negative for referring to different sides of the line
// Box.prototype.boxOnSameSideOfLine = function(point_a,point_b, side_sgn){
	// return (pointLineRelationFunction(point_a,point_b,this.min              ) >= side_sgn &&
			// pointLineRelationFunction(point_a,point_b,this.getTopLeft()     ) >= side_sgn &&
			// pointLineRelationFunction(point_a,point_b,this.getBottomRight() ) >= side_sgn &&
			// pointLineRelationFunction(point_a,point_b,this.getTopRight()    ) >= side_sgn );
// }

// Box.prototype.intersectsLine = function(p1,p2){
	// var minX = p1.x;
    // var maxX = p2.x;
    
    // if (p1.x > p2.x) {
        // minX = p2.x;
        // maxX = p1.x;
    // }
    
    // if (maxX > this.left + this.width)
        // maxX = this.left + this.width;
    
    // if (minX < this.left)
        // minX = this.left;
    
    // if (minX > maxX)
        // return false;
    
    // var minY = p1.y;
    // var maxY = p2.y;
    
    // var dx = p2.x - p1.x;
    
    // if (Math.abs(dx) > 0.0000001) {
        // var a = (p2.y - p1.y) / dx;
        // var b = p1.y - a * p1.x;
        // minY = a * minX + b;
        // maxY = a * maxX + b;
    // }
    
    // if (minY > maxY) {
        // var tmp = maxY;
        // maxY = minY;
        // minY = tmp;
    // }
    
    // if (maxY > this.top + this.height)
        // maxY = this.top + this.height;
    
    // if (minY < this.top)
        // minY = this.top;
    
    // if (minY > maxY)
        // return false;
    
    // return true;

// }


// //-----------------------------------------------------------------------------


// // returns a list of visibility triangles,
// // fov_angle is the angle from player_dir to any of the two side rays that defines the field of view
// function visibilityField(list_of_boxes, screen_box, player_pos, player_dir, fov_angle){
	// // 1  ---- first filter boxes that are on the same screen as the player, and that are on the field of view.
	// var ray_length_max 100f;  //=  sqrt( (screen_box.max.x)*(screen_box.max.x) + (screen_box.max.y)*(screen_box.max.y) );  
	// var player_dir_perp        = new Vec2(-player_dir.y, player_dir.x);
	// var player_right_limit_pos = Vec2.add( player_pos, Vec2.scale(player_dir_perp,ray_length_max));
	// var player_left_limit_pos  = Vec2.substract( player_pos, Vec2.scale(player_dir_perp,ray_length_max));
								 
	// var TOL = 0.0000001;
	// var candidate_boxes = new Array();
	// for(var i=0; i<list_of_boxes.length; i++){
		// if(screen_box.boxInBox(list_of_boxes[i])){ //box is on screen 
			// // now check if box in on the half screen square defined by the direction of the player and its perpendicular direction
			// if(list_of_boxes[i].boxOnSameSideOfLine(player_left_limit_pos, player_right_limit_pos, TOL)){
				// candidate_boxes.push(list_of_boxes[i]);
			// }
		// }
	// }
	
	// // 2 ---- get the list of triangles from    boxes_on_fov,  fov_pos_left , fov_pos_right
	// var fov_dir_left   = new Vec2 (cos(fov_angle) * player_dir.x - sin(fov_angle) * player_dir.y , 
								   // sin(fov_angle) * player_dir.x + cos(fov_angle) * player_dir.y);
								   
						 
	// var fov_dir_right  = new Vec2 (cos(fov_angle) * player_dir.x + sin(fov_angle) * player_dir.y , 
								  // -sin(fov_angle) * player_dir.x + cos(fov_angle) * player_dir.y); 	
								  
	// var triangles_visible_vertices = new Array();
	// for(var i=0; i<candidate_boxes.length; i++){
	
	// }
// }

