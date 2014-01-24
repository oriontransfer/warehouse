
//if F(a, b, point) > tol, point is "above" the line (a,b) 
//if F(a, b, point) < tol, point is "below" the line (a,b)
//otherwise, point is ON the line (a,b). 
//tol = 0.0000001
//source = http://stackoverflow.com/questions/99353/how-to-test-if-a-line-segment-intersects-an-axis-aligned-rectange-in-2d
function pointLineRelationFunction(point_a, point_b, point){
	return (point_b.y - point_a.y)*point.x + (point_a.x - point_b.x)*point.y + (point_b.x*point_a.y + point_a.x*point_b.y);
}


//---------------------------------------------------------------------------------------


//---- Box class
function Box (min, max) {
  this.min = min;
  this.max = max;
};

//check if the point is inside the box
//point is a Vec2 
Box.prototype.pointInBox = function(point) {
	return (point.x>min.x && point.x<min.x+max.x  && point.y>min.y && point.y>min.y + max.y);
}

Box.prototype.getTopLeft = function(){
	return new Vec2( Vec2.add(min, new Vec2(0,this.max.y) ) );
}

Box.prototype.getBottomRight = function(){
	return new Vec2( Vec2.add(min, new Vec2(this.max.x,0) ) ); 
}

Box.prototype.getTopRight = function(){
	return new Vec2( Vec2.add(min, max ) ); 
}

//check if  other_box is inside the box, by checking that all four vertices of other_box are inside the box
Box.prototype.boxInBox = function(other_box){
	return ( this.pointInBox(other_box.min              ) && 
	         this.pointInBox(other_box.getTopLeft()     ) &&	 
	         this.pointInBox(other_box.getBottomRight() ) && 
			 this.pointInBox(other_box.getTopRight()    );
}


// check if all the vertices of the box are on the same side of the line defined by point_a, point_b,
// uses pointLineRelationFunction function with a side_sgn positive or negative for referring to different sides of the line
Box.prototype.boxOnSameSideOfLine = function(point_a,point_b, side_sgn){
	return (pointLineRelationFunction(point_a,point_b,this.min              ) > side_sgn &&
			pointLineRelationFunction(point_a,point_b,this.getTopLeft()     ) > side_sgn &&
			pointLineRelationFunction(point_a,point_b,this.getBottomRight() ) > side_sgn &&
			pointLineRelationFunction(point_a,point_b,this.getTopRight()    ) > side_sgn );
}

//-----------------------------------------------------------------------------


// returns a list of visibility triangles,
// fov_angle is the angle from player_dir to any of the two side rays that defines the field of view
function visibilityField(list_of_boxes, screen_box, player_pos, player_dir, fov_angle){
	// 1  ---- first filter boxes that are on the same screen as the player.
	var candidate_boxes;
	for(var i=0; i<list_of_boxes.length; i++){
		if(screen_box.boxInBox(list_of_boxes[i])){
			canditate_boxes.push(list_of_boxes[i]);
		}
	}

	// 2 ---- now filter candidate boxes that are on the field of view
	var ray_length_max =  sqrt( (screen_box.max.x/2)*(screen_box.max.x/2) + (screen_box.max.y/2)*(screen_box.max.y/2) );
	var fov_pos_left   = Vec2.add( player_pos , Vec2.scale( new Vec2 (cos(fov_angle) * player_dir.x - sin(fov_angle) * player_dir.y , 
																	  sin(fov_angle) * player_dir.x + cos(fov_angle) * player_dir.y) , ray_length_max ) 
								 );
						 
	var fov_pos_right  = Vec2.add( player_pos , Vec2.scale( new Vec2 (cos(fov_angle) * player_dir.x + sin(fov_angle) * player_dir.y , 
																	 -sin(fov_angle) * player_dir.x + cos(fov_angle) * player_dir.y) , ray_length_max ) 
								 );	

	var TOL = 0.0000001;
	var boxes_on_fov;
	for(var i=0; i<candidate_boxes.length; i++){
		if(candidate_boxes[i].boxOnSameSideOfLine(player_pos, fov_pos_left, -TOL) && candidate_boxes[i].boxOnSameSideOfLine(player_pos, fov_pos_right, TOL)){
			boxes_on_fov.push(candidate_boxes[i]);
		}
	}
	
	// 3 ---- get the list of triangles from    boxes_on_fov,  fov_pos_left , fov_pos_right
	
	// TO DO...
	
}

