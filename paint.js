		var PAINT = function (options){ 
			//if no options, great we'll do it all by our self.
			var options = options || {};
			
			//orietation is for tablet devices.
			var orientation = options.orientation || 'landscape';
			
			//default width & height, get monkeyed with when orientation changes.
			var width = options.width || 1024;
			var height = options.height || 748;
						
			var containerElement = options.container || function(){
				var c = document.createElement('div');
				c.setAttribute('id', 'paintContainer');
				document.body.appendChild(c);
				return c;
			}();
					
			// paint canvas element stuff.
			var paintCanvas = options.paintCanvas || function(){
				var c = document.createElement('canvas');
				c.setAttribute('id', 'paintCanvas');
				c.setAttribute('class', 'paintCan');
				c.setAttribute('height', height);
				c.setAttribute('width', width);
				//c.setAttribute('z-index', 0);
				containerElement.appendChild(c);
				return c;
			}();
						
			var paintContext = paintCanvas.getContext('2d');
			
			//the palettes will live on control canvas.
			var controlCanvas = options.controlCanvas || function(){
				var c = document.createElement('canvas');
				c.setAttribute('id', 'controlCanvas');
				c.setAttribute('height', height);
				c.setAttribute('width', width);
				//c.setAttribute('z-index', 1);
				containerElement.appendChild(c);
				return c;
			}();
			
			var controlContext = controlCanvas.getContext('2d');

			var setColor = function (color){
				toolColor = color;
			}
			var setTool = function (tool){
				activeTool = tool;
			}
			
			//lets add some default shapes to draw.
			// each shape is an array of points on a 100x100 grid, will 
			// be scaled. 50,50 is assumed to be the center.
			// if options object contains more shapes, then add them to this 
			// object (or replace these)
			
			var shapes = {
				crayon: [[30,10],[45,20],[50,18],[90,60],[70,80],[30,40],[33,33],[22,18]],
				star: [[50,0],[62.5,37.5],[100,37.5],[68.75,59.37],[81.25,95],[50,75],[18.75,95],[31.25,59.37],[0,37.5],[37.5,37.5]],
				saveIcon:[[100,0],[100,90],[90,100],[20,100],[20,70],[70,70],[70,100],[0,100],[0,0]],
				triangle: [[50,0],[100,100],[0,100]],
				square: [[0,0],[100,0],[100,100],[0,100]],
				eraser: [[10,30],[100,30],[90,70],[0,70]],
			}
			

			//are we dragging or clicking?
			var clicking = false;
			var dragging = false;
			
			var drawCircle = function (context, posX, posY, hexColor, diameter, strokeColor, lineWidth){
					context.fillStyle = hexColor;
					context.beginPath();
					context.arc(posX, posY,diameter / 2, 0, Math.PI * 2);
					context.fill();
					if(strokeColor){
						if(lineWidth){
							context.lineWidth = lineWidth;
						}
						context.strokeStyle = strokeColor;
						context.stroke();
					}
					context.closePath();
			};
						
			var drawShape = function(context, posX, posY, shape, hexColor, scale, strokeColor, lineWidth){
				//scaling factor. 100 = 100%
				scale = scale/100;
				
				//posX and posY need to represent the center of the object.
				// so lets estimate the center
				var cenX =0;
				var cenY =0;
				for (var i=0; i < shape.length; i++) {
				  cenX += shape[i][0];
				  cenY += shape[i][1];
				};
				cenX = cenX / shape.length;
				cenY = cenY / shape.length;
				
				posX -= cenX*scale;
				posY -= cenY*scale; 
				
				context.fillStyle = hexColor;
				context.beginPath();
				//move to the first point before we draw.
				context.moveTo(posX + scale * shape[1][0], posY + scale * shape[1][1]);
				for (var i=0; i < shape.length; i++) {
				  //draw each point in the array.
				  context.lineTo(posX + scale * shape[i][0], posY + scale * shape[i][1]);
				};
				//draw the first point again
				context.lineTo(posX + scale * shape[0][0], posY +  scale * shape[0][1]);
				
				context.fill();
				if(strokeColor){
					if(lineWidth){
						context.lineJoin = 'round';
						context.lineWidth = lineWidth;
					}
					context.strokeStyle = strokeColor;
					context.stroke();
				}
				context.closePath();
				
			};
			
			var drawToolbars = function(context){
				//we'll make all the icons the same size (the size of the smallest)
				var iconHeight = (colors.length < tools.length)? height / tools.length : height / colors.length ;
				//if we're portrati, make it a little smaller
				
				// clear of the current toolbars, in case we need to change hilighting.
				context.canvas.width = context.canvas.width;
				
				//a simple background for the buttons
				context.fillStyle = "rgba(100,100,100,.5)";
				context.fillRect(width - iconHeight, 0, iconHeight, height);
				context.fillRect(0, 0, iconHeight, height);
								
				for (var i = 0; i <= colors.length - 1; i++){
				  var color = (typeof colors[i] == 'function')? colors[i]() : colors[i];
				  drawShape(context, iconHeight / 2, iconHeight / 2 + i * iconHeight, shapes.square ,color, iconHeight * .7, "black", 2);
				};


				//put the tools evenly spaced on the right side.
				
				for (var i = 0; i <= tools.length - 1; i++){
				  tools[i].icon(context, width - .5 * iconHeight,iconHeight * .5 + i * toolSpacing);
				};
			};
			
			var paint = function(context, x,y, hexColor, size){
				if(clicking && dragging){
					context.strokeStyle = hexColor;
					context.lineWidth = size;
					context.lineJoin = 'round';
					context.lineTo(x,y);
					context.stroke();
				}
				else if(clicking){
					context.beginPath();
					context.moveTo(x,y);
				}
				else{
					context.closePath();
				}
			};
			
		
			var saveImage = function(){
				document.location.href = paintCanvas.toDataURL();
			};
			
			var eraseAll = function(){
				paintCanvas.width = paintCanvas.width;
			};
			
			//the colors to use in the palette, css valid, otherwise a function.
			var colors = ["red", "orange", "yellow", "#00ff00", "rgba(0,0,255,255)", "indigo", "violet", ];
			
			//tool settings/defaults.
			var tools = options.tools || [
						  {
						  icon: function(context, x,y){
						    	drawShape(context, x,y,shapes.crayon, toolColor, 90, "black", 2);
						    	}, 
							  tool: function(context, x,y){
							  	paint(context, x,y,toolColor, 20);
							  	}
						   },
						  {
						  icon: function(context,x,y){
						    	drawShape(context,x,y,shapes.square, toolColor, 70, "black", 2);
						    	}, 
							  tool: function(context,x,y){
							  	drawShape(context, x,y,shapes.square, toolColor, 55);
							  	}
						  },
						  {
						  icon: function(context,x,y){
							  drawCircle(context,x,y,toolColor, 75, "black", 2);
							}, 
							  tool: function(context,x,y){
							  drawCircle(context, x,y,toolColor, 50);
							}
						  },
						  {
						  icon: function(context,x,y){
						    	drawShape(context,x,y,shapes.triangle, toolColor, 70, "black", 2);
						    	}, 
							  tool: function(context,x,y){
							  	drawShape(context, x,y,shapes.triangle, toolColor, 55);
							  	}
						  },
						  {
						  icon: function(context,x,y){
						    	drawShape(context,x,y,shapes.star, toolColor, 80, "black", 2);
						    	}, 
							  tool: function(context,x,y){
							  	drawShape(context, x,y,shapes.star, toolColor, 50);
							  	}
						  },/* dont need save right now
						  {
						   icon: function(context,x,y){
						    	drawShape(context,x,y,shapes.saveIcon, "lightgray", 63, "black", 2);
						    	}, 
							  tool: saveImage,
						   },*/
						   {
						   icon: function(context,x,y){
						    	drawShape(context,x,y,shapes.eraser, "pink", 63, "black", 2);
						    	}, 
							  tool: eraseAll,
						   },
						];
			
			var toolColor = options.startColor || colors[Math.floor(Math.random()*colors.length)];

			var activeTool = options.startTool || tools[0].tool;
			var toolSpacing = height / tools.length;
			
			
			
			//events go below.
			
			//
			function orientationChange() {
				var tempHeight = height;
				height = width - 20;
				width = tempHeight + 20;
				controlCanvas.width = width;
				controlCanvas.height = height;
				paintCanvas.height = height;
				paintCanvas.width = width;
				drawToolbars(controlContext);
				orientation = (orientation == 'landscape')? 'landscape' : 'portrait';

			};
			
			var canvasClick = function(e) {
					clicking = true;
					//first we need to know where on the canvas was clicked.
					if (e.pageX || e.pageY) { 
					  x = e.pageX - controlCanvas.offsetLeft;
					  y = e.pageY - controlCanvas.offsetTop;
					}
					else { 
					  x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - controlCanvas.offsetLeft; 
					  y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - controlCanvas.offsetTop; 
					} 
					// if a command area was clicked, execute the command, else, execute our selected tool unless
					// we were dragging when we showed up. 
					var swatchHeight = height / colors.length;
					if(x < (swatchHeight)){
						var selectedRegion = Math.floor(y/swatchHeight);
						if(typeof colors[selectedRegion] == 'function'){
							setColor(colors[selectedRegion]());
						}
						else{
							setColor(colors[selectedRegion]);
						}
						//redraw toolbar with selected color.
						drawToolbars(controlContext);
					}
					else if (x > width - (.5 * toolSpacing)){ 
						var selectedTool = Math.floor(y/toolSpacing);
						setTool(tools[selectedTool].tool);
					}
					else {
						activeTool(paintContext, x,y,toolColor, 50);
					}
			};
			
			var mouseMove = function(e){ 
					//disable springiness in iOS
					e.preventDefault();
					
					dragging = (clicking)? true: false;
						if(dragging){
							//canvasMove();	
							canvasClick(e);
						}
			};
					
			var mouseUp = function(){
				clicking = false;
				dragging = false; 
			};
			
			//last but not least, our initializer:
			var init = function(){
					//draw the toolbars
					drawToolbars(controlContext);
					
					if("createTouch" in document){
						//register events for ipad interaction
						controlCanvas.addEventListener('touchstart', canvasClick,false);
						controlCanvas.addEventListener('touchend', mouseUp,false);
						controlCanvas.addEventListener('touchend', mouseUp,false);
						controlCanvas.addEventListener('touchmove', mouseMove,false);
						document.body.addEventListener('onorientationchange', orientationChange, false)
					} else {
						//register our events for mouse interaction.
						controlCanvas.addEventListener('mousedown', canvasClick,false);
						controlCanvas.addEventListener('mouseout', mouseUp,false);
						controlCanvas.addEventListener('mouseup', mouseUp,false);
						controlCanvas.addEventListener('mousemove', mouseMove,false);
					}

			};
			
			return {
				
				init: init,
				setColor: setColor,
				setTool: setTool,
				
			}
		};