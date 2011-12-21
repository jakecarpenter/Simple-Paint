		var PAINT = function (options){ 
			//if no options, great we'll do it all by our self.
			var options = options || {};
			
			//orietation is for tablet devices.
			var orientation = options.orientation || 90;
			
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
			
			var drawCircle = function (properties){
					// function(context, posX, posY, shape, hexColor, scale, strokeColor, lineWidth){
				var properties = properties || {};

				//scaling factor. 1 = 100%, .5 = 50%
				var diameter = properties.scale  || 100;
						
				//which context do we use? if none supplied, assume first canvas
				var context = properties.context || document.getElementsByTagName('canvas')[0].getContext('2d');
				
				//where do we draw it?
				var x = properties.x || 0;
				var y = properties.y || 0;
				
				//object properites
				var fillStyle = properties.fillStyle || "";
				var strokeColor = properties.strokeStyle || "";
				var lineStyle = properties.lineStyle || "";
				var lineWidth = properties.lineWidth || "";
				var lineJoin = properties.lineJoin || "round";

				//shadow properties if any shadow object is passed, draw a shadow.
				if(properties.shadow){
					var shadow = true;
					var shadowOffsetX = properties.shadow.offsetX || 0;
					var shadowOffsetY = properties.shadow.offsetY || 0;
					var shadowBlur = properties.shadow.blur || 5;
					var shadowColor = properties.shadow.color || "white";
				}
				
				context.beginPath();
				context.arc(x, y,diameter / 2, 0, Math.PI * 2);
				
				if(strokeColor){
					if(lineWidth){
						context.lineWidth = lineWidth;
					}
					context.strokeStyle = strokeColor;
					context.stroke();
				}
				
				if(shadow){
					context.shadowOffsetX = shadowOffsetX;
					context.shadowOffsetY = shadowOffsetY;
					context.shadowBlur    = shadowBlur;
					context.shadowColor   = shadowColor;
				}
				
				
				//fill the obkect
				context.fillStyle = fillStyle;
				context.fill();
				
				//stop drawing the shadow, if we did
				if(shadow){
					context.shadowOffsetX = 0;
					context.shadowOffsetY = 0;
					context.shadowBlur    = 0;
					context.shadowColor   = 0;
				}
				
				context.closePath();
			};
						
			var drawShape = function(properties){
				// function(context, posX, posY, shape, hexColor, scale, strokeColor, lineWidth){
				var properties = properties || {};

				//scaling factor. 1 = 100%, .5 = 50%
				var scale = properties.scale / 100  || 1;
				
				//what shape do we draw? if nothing, nothing.
				var shape = properties.shape || [];
				
				//which context do we use? if none supplied, dont do anything.
				var context = properties.context || document.getElementsByTagName('canvas')[0].getContext('2d');
				
				//where do we draw it?
				var x = properties.x || 0;
				var y = properties.y || 0;
				
				//object properites
				var fillStyle = properties.fillStyle || "";
				var strokeColor = properties.strokeStyle || "";
				var lineStyle = properties.lineStyle || "";
				var lineWidth = properties.lineWidth || "";
				var lineJoin = properties.lineJoin || "round";
				
				//shadow properties if any shadow object is passed, draw a shadow.
				if(typeof properties.shadow === 'object'){
					var shadow = true;
					var shadowOffsetX = properties.shadow.offsetX || 0;
					var shadowOffsetY = properties.shadow.offsetY || 0;
					var shadowBlur = properties.shadow.blur || 0;
					var shadowColor = properties.shadow.color || "";
				}

				
				//x and y will need to be offset to the center of the object.
				// so lets estimate the center unless noCenter is set to true.
				if(!properties.noCenter){
					
					x = properties.centerX || function(){
						var centerX = 0;
						//find the average X of all the shape's points.
						for (var i=0; i < shape.length; i++) {
					  		centerX += shape[i][0];
					  		//console.log(shape[i][0])
					  	};
					  	centerX = centerX / shape.length;
					  	return x -= centerX*scale;
					}();
					
					y = properties.centerY || function(){
						var centerY = 0;
						//find the average Y of all the shape's points.
						for (var i=0; i < shape.length; i++) {
					  		centerY += shape[i][1];
						};
						centerY = centerY / shape.length;
						return y -= centerY*scale;
					}();
				}

				//lets start drawing.
				context.beginPath();
				
				//move to the first point before we draw.
				context.moveTo(x + scale * shape[1][0], y + scale * shape[1][1]);
				for (var i=0; i < shape.length; i++) {
				  //draw each point in the array.
				  context.lineTo(x + scale * shape[i][0], y + scale * shape[i][1]);
				};
				//draw the first point again
				context.lineTo(x + scale * shape[0][0], y +  scale * shape[0][1]);
				
				//if there is a stroke color, assume we're stroking.
				if(strokeColor){
					if(lineWidth){
						context.lineJoin = 'round';
						context.lineWidth = lineWidth;
					}
					context.strokeStyle = strokeColor;
					context.stroke();
				}
				
				//if there is shadow sub property, draw shadow.
				if(shadow){
					context.shadowOffsetX = shadowOffsetX;
					context.shadowOffsetY = shadowOffsetY;
					context.shadowBlur    = shadowBlur;
					context.shadowColor   = shadowColor;
				}
				
				
				//fill the obkect
				context.fillStyle = fillStyle;
				context.fill();
				
				//stop drawing the shadow, if we did
				if(shadow){
					context.shadowOffsetX = 0;
					context.shadowOffsetY = 0;
					context.shadowBlur    = 0;
					context.shadowColor   = 0;
				}
				
				//stop drawing.
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
				  var settings = {
				  	context: controlContext,
				  	x: iconHeight / 2,
				  	y:  iconHeight / 2 + i * iconHeight,
				  	shape: shapes.square,
				  	fillStyle: color,
				  	scale: iconHeight * .7,
				  	strokeStyle: "black",
				  	lineWidth: 2,
				  };
				  drawShape(settings);
				};
				
				//put the tools evenly spaced on the right side.
				for (var i = 0; i <= tools.length - 1; i++){
				  
				 var toolSettings = {
				  	context: controlContext,
				  	x: width - .5 * iconHeight,
				  	y:  iconHeight * .5 + i * toolSpacing,
				  	fillStyle: color,
				  	scale: iconHeight * .7,
				  	strokeStyle: "black",
				  	lineWidth: 2,
				  }
				  //lets adda glow to the active tool.
				  if(tools[i].tool === activeTool){
				  	toolSettings.shadow = {
				  		offsetX: 4,
				  		offsetY: 4,
				  		blur: 10,
				  		color: "rgba(0,0,0,.8)"
				  	}
				  }
				  tools[i].icon(toolSettings);
				};			
			};
			
			var paint = function(properties){
				
				var properties = properties || {};
				
				//which context do we use? if none supplied, dont do anything.
				var context = properties.context || document.getElementsByTagName('canvas')[0].getContext('2d');
				
				//where do we draw it?
				var x = properties.x || 0;
				var y = properties.y || 0;
				
				//object properites
				var fillStyle = properties.fillStyle || "";
				var strokeColor = properties.strokeStyle || "";
				var lineStyle = properties.lineStyle || "";
				var lineWidth = properties.lineWidth || "";
				var lineJoin = properties.lineJoin || "round";
				
				//shadow properties if any shadow object is passed, draw a shadow.
				if(properties.shadow){
					var shadow = true;
					var shadowOffsetX = properties.shadow.offsetX || 0;
					var shadowOffsetY = properties.shadow.offsetY || 0;
					var shadowBlur = properties.shadow.blur || 5;
					var shadowColor = properties.shadow.color || "white";
				}
				//now we get around to drawing our line.
				if(clicking && dragging){
					context.strokeStyle = fillStyle;
					context.lineWidth = lineWidth;
					context.lineJoin = lineJoin;
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
			
			var eraser = function(properties){
							
				var properties = properties || {};
				
				//which context do we use? if none supplied, dont do anything.
				var context = properties.context || document.getElementsByTagName('canvas')[0].getContext('2d');
				
				//where do we draw it?
				var x = properties.x || 0;
				var y = properties.y || 0;
				
				//line properties
				var lineWidth = properties.lineWidth || "";
				var lineJoin = properties.lineJoin || "round";
				
				if(clicking && dragging){
					context.globalCompositeOperation = 'destination-out';
					context.strokeStyle = 'red';
					context.lineWidth = lineWidth;
					context.lineJoin = lineJoin;
					context.lineTo(x,y);
					context.stroke();
					context.globalCompositeOperation = 'source-over';
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
			
			var colorCycle = function(){
				
				//make the arguments object into an array so we can access the array proto funcs.
				var myColors = (arguments[0])? Array.prototype.slice.call(arguments) : ["red","green", "blue"];
				
				//if the current tool colors is one we are cycling, return its position
				var currentKey = myColors.indexOf(toolColor);
				
				//if we can go to the next color, do so, otherwise, go to the first in the array.
				return (myColors[currentKey + 1])? myColors[currentKey + 1]: myColors[0];
			};
			
			//the colors to use in the palette, css valid, otherwise a function.
			var colors = [function(){
							//reds
						  	return colorCycle("#f00","#c00","#900");
						  },
						  function(){
						  	//oranges
						  	return colorCycle("#f30","#c30","#f60","#f90");
						  },
						  function(){
						  	return colorCycle("#ff0","#ff3","#ff6","#ff9");
						  },
						  function(){
						  	//greens
						  	return colorCycle("#0F0","#3c0","#090","#060");
						  },
						  function(){
						  	//blues
						  	return colorCycle("#00F","#03f","#06f","#09f");
						  },
						  function(){
						  	//indigo
						  	return colorCycle("#90f","#60f","#93f","#99f");
						  },
						  function(){
						  	return colorCycle("black","white","brown");
						  },
						  	];
			
			//tool settings/defaults.
			var tools = options.tools || [
						  {
						  icon: function(properties){
						  			properties.shape = shapes.crayon;
						  			properties.fillStyle = toolColor;
						  			properties.strokeStyle = "black";
						  			properties.lineWidth = 2;
						    		drawShape(properties);
						    	}, 
							  tool: function(properties){
							  	properties.lineWidth = 20;
							  	paint(properties);
							  	}
						   },
						  {
						  icon: function(properties){
						  			properties.shape = shapes.square;
						  			properties.fillStyle = toolColor;
						  			properties.strokeStyle = "black";
						  			properties.lineWidth = 2;
						    		drawShape(properties);
						    	},  
							  tool: function(properties){
							  	properties.shape = shapes.square;
					  			properties.fillStyle = toolColor;
					  			properties.scale = 55;
					    		drawShape(properties);
							  	}
						  },
						  {
						  icon: function(properties){
								properties.shape = shapes.square;
								properties.fillStyle = toolColor;
								properties.strokeStyle = "black";
								properties.lineWidth = 2;
							    drawCircle(properties);
							}, 
							  tool: function(properties){
							  	properties.size = 50;
							  	properties.fillStyle = toolColor;
							  drawCircle(properties);
							}
						  },
						  {
						  icon: function(properties){
						  			properties.shape = shapes.triangle;
						  			properties.fillStyle = toolColor;
						  			properties.strokeStyle = "black";
						  			properties.lineWidth = 2;
						    		drawShape(properties);
						    	}, 
							  tool: function(properties){
							  	properties.shape = shapes.triangle;
					  			properties.fillStyle = toolColor;
					  			properties.scale = 55;
					    		drawShape(properties);
							  	}
						  },
						  {
						  icon: function(properties){
						  			properties.shape = shapes.star;
						  			properties.fillStyle = toolColor;
						  			properties.strokeStyle = "black";
						  			properties.lineWidth = 2;
						    		drawShape(properties);
						    	},  
							  tool: function(properties){
							  	properties.shape = shapes.star;
					  			properties.fillStyle = toolColor;
					  			properties.scale = 50;
					    		drawShape(properties);
							  	}
						  },/* dont need save right now
						  {
						   icon: function(context,x,y){
						    	drawShape(context,x,y,shapes.saveIcon, "lightgray", 63, "black", 2);
						    	}, 
							  tool: saveImage,
						   },*/
						   {
						   icon: function(properties){
						  			properties.shape = shapes.eraser;
						  			properties.fillStyle = "pink";
						  			properties.strokeStyle = "black";
						  			properties.lineWidth = 2;
						    		drawShape(properties);
						    	},  
							  tool: function(properties){
							  	properties.lineWidth = 80;
							  	eraser(properties);
							  	},
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
				orientation = (orientation == 90)? 90 : 0;
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
						//if this is called while dragging, do nothing.
						if(dragging){
							return;
						}
											
						var selectedRegion = Math.floor(y/swatchHeight);
						if(typeof colors[selectedRegion] == 'function'){
							setColor(colors[selectedRegion]());
						}
						else{
							setColor(colors[selectedRegion]);
						}
						//redraw toolbar with selected color.
						drawToolbars(controlContext);
						//we don't we don't want to drag off of the toolbar, so turn off clicking
						clicking = false;
					}
					else if (x > width - (.5 * toolSpacing)){
						//if this is called while dragging, do nothing.
						if(dragging){
							return;
						}
					
						var selectedTool = Math.floor(y/toolSpacing);
						setTool(tools[selectedTool].tool);
						//redraw toolbar with selected color.
						drawToolbars(controlContext);
						
						//we don't we don't want to drag off of the toolbar, so turn off clicking
						clicking = false;
					}
					else {
						var toolSettings = {
							context: paintContext,
							x: x,
							y: y, 
							fillStyle:toolColor,
							scale: 50,
						};
						activeTool(toolSettings);
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
					
					toolColor = (typeof toolColor != 'function')? toolColor : toolColor();
								
					//draw the toolbars
					drawToolbars(controlContext);
					
					if("createTouch" in document){
						//we must be on a device that supports touch, so it probably also supports rotation
						// its hacky, but hey...
						orientation = Math.abs(window.orientation);
						
						//register events for ipad interaction
						controlCanvas.addEventListener('touchstart', canvasClick,false);
						controlCanvas.addEventListener('touchend', mouseUp,false);
						controlCanvas.addEventListener('touchend', mouseUp,false);
						controlCanvas.addEventListener('touchmove', mouseMove,false);
						window.addEventListener('orientationchange', orientationChange, false)
					} else {
						//register our events for mouse interaction.
						controlCanvas.addEventListener('mousedown', canvasClick,false);
						controlCanvas.addEventListener('mouseout', mouseUp,false);
						controlCanvas.addEventListener('mouseup', mouseUp,false);
						controlCanvas.addEventListener('mousemove', mouseMove,false);
					}

			};
			
			return {
				
				init: init
			}
		};