var nodeRadius = 30;
var highlight = 'blue';
var base = 'black';
var dragging = false;
var shiftPressed = false;
var startClick: {x: number, y: number} | null = null;
var tempArrow: TemporaryArrow | Arrow | SelfArrow | EntryArrow | null = null;
var selectedObj: Circle | EntryArrow | Arrow | SelfArrow | null = null;
var circles: Circle[] = [];
var arrows: (Arrow | SelfArrow | EntryArrow)[] = [];
var snapToPadding = 10; // pixels
var hitTargetPadding = 6; // pixels

// Creates subscript text to the input string using underscores before 0-9 as the regex
function subscriptText(text: string) {
  var subscriptText = text;
  for(var i = 0; i < 10; i++) {
    subscriptText = subscriptText.replace(new RegExp('_' + i, 'g'), String.fromCharCode(8320 + i));
  }
  return subscriptText;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  originalText: string,
  x: number,
  y: number,
  angeOrNull: number | null,
  isSelected: boolean
) {
  ctx.font = '20px Times New Roman', 'serif';
  var text = subscriptText(originalText)
  var width = ctx.measureText(text).width;
  x -= width / 2;

  if (angeOrNull != null) {
    var cos = Math.cos(angeOrNull);
    var sin = Math.sin(angeOrNull);
    var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
		var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
		var slide = sin * Math.pow(Math.abs(sin), 40) * cornerPointX - cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
		x += cornerPointX - sin * slide;
		y += cornerPointY + cos * slide;
  }
    x = Math.round(x);
    y = Math.round(y);
		ctx.fillText(text, x, y + 6);
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
  var dx = Math.cos(angle);
  var dy = Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 10 * dx + 5 * dy, y - 8 * dy - 5 * dx);
  ctx.lineTo(x - 10 * dx - 5 *dy, y - 8 * dy + 5 * dx);
  ctx.fill();
}

function det(
  a: number, 
  b: number, 
  c: number, 
  d: number, 
  e: number, 
  f: number, 
  g: number, 
  h: number, 
  i: number
) {
	return a*e*i + b*f*g + c*d*h - a*f*h - b*d*i - c*e*g;
}


function circleFromThreePoints(
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number, 
  x3: number, 
  y3: number) {
	var a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
	var bx = -det(x1*x1 + y1*y1, y1, 1, x2*x2 + y2*y2, y2, 1, x3*x3 + y3*y3, y3, 1);
	var by = det(x1*x1 + y1*y1, x1, 1, x2*x2 + y2*y2, x2, 1, x3*x3 + y3*y3, x3, 1);
	var c = -det(x1*x1 + y1*y1, x1, y1, x2*x2 + y2*y2, x2, y2, x3*x3 + y3*y3, x3, y3);
	return {
		'x': -bx / (2*a),
		'y': -by / (2*a),
		'radius': Math.sqrt(bx*bx + by*by - 4*a*c) / (2*Math.abs(a))
	};
}

class Circle {
  x: number;
  y: number;
  mouseOffsetX: number;
  mouseOffsetY: number;
  isAccept: boolean;
  text: string;

  constructor(x: number, y: number) {
    this.x = x,
    this.y = y;
    this.mouseOffsetX = 0;
    this.mouseOffsetY = 0;
    this.isAccept = false;
    this.text = '';
  }

  setMouseStart(x: number, y: number): void {
    this.mouseOffsetX = this.x - x;
    this.mouseOffsetY = this.y - y;
  }

  setAnchorPoint(x: number, y: number): void {
    this.x = x + this.mouseOffsetX;
    this.y = y + this.mouseOffsetY;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, nodeRadius, 0, 2 * Math.PI, false);
    ctx.stroke();
    drawText(ctx, this.text, this.x, this.y, null, selectedObj == this);

    if (this.isAccept) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, nodeRadius - 5, 0, 2 * Math.PI, false);
      ctx.stroke();
    }
  }

  closestPointOnCircle(x: number, y: number) {
    var dx = x - this.x;
    var dy = y - this.y;
    var scale = Math.sqrt(dx * dx + dy * dy);
    return {
      'x': this.x + dx * nodeRadius / scale,
      'y': this.y + dy * nodeRadius / scale
    }
  }

  containsPoint(x: number, y: number) {
    return (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) < nodeRadius * nodeRadius;
  }
}

class TemporaryArrow {
  startPoint: {x: number, y: number};
  endPoint: {x: number, y: number};


  constructor(startPoint: {x: number, y: number}, endPoint: {x: number, y: number}) {
    this.startPoint = startPoint;
    this.endPoint = endPoint;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.moveTo(this.endPoint.x, this.endPoint.y);
    ctx.lineTo(this.startPoint.x, this.startPoint.y);
    ctx.stroke();

    drawArrow(
      ctx, 
      this.endPoint.x, 
      this.endPoint.y, 
      Math.atan2(this.endPoint.y - this.startPoint.y, this.endPoint.x - this.startPoint.x)
    );
  }
}

class EntryArrow {
  pointsToCircle: Circle;
  deltaX: number;
  deltaY: number;
  text: string;

  constructor(pointsToCircle: Circle, startPoint: {x: number, y: number}) {
    this.pointsToCircle = pointsToCircle;
    this.deltaX = 0
    this.deltaY = 0;
    this.text = ''
    if (startPoint) {
      this.setAnchorPoint(startPoint.x, startPoint.y);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    var points = this.getEndPoints();

    ctx.beginPath();
    ctx.moveTo(points.startX, points.startY);
    ctx.lineTo(points.endX, points.endY);
    ctx.stroke();
    
    // Draw the text at the end without the arrow
    var textAngle = Math.atan2(points.startY - points.endY, points.startX - points.endX);
    drawText(ctx, this.text, points.startX, points.startY, textAngle, selectedObj == this);

    // Draw the head of the arrow
    drawArrow(ctx, points.endX, points.endY, Math.atan2(-this.deltaY, -this.deltaX));
  }

  setAnchorPoint(x: number, y: number) {
    this.deltaX = x - this.pointsToCircle.x;
    this.deltaY = y - this.pointsToCircle.y;

    if (Math.abs(this.deltaX) < snapToPadding) this.deltaX = 0;
    if (Math.abs(this.deltaY) < snapToPadding) this.deltaY = 0;
  }

  getEndPoints() {
    var startX = this.pointsToCircle.x + this.deltaX;
    var startY = this.pointsToCircle.y + this.deltaY;
    var end = this.pointsToCircle.closestPointOnCircle(startX, startY);
    return {
			'startX': startX,
			'startY': startY,
			'endX': end.x,
			'endY': end.y,
		};
  }

  containsPoint(x: number, y: number) {
    var lineInfo = this.getEndPoints();
    var dx = lineInfo.endX - lineInfo.startX;
		var dy = lineInfo.endY - lineInfo.startY;
		var length = Math.sqrt(dx * dx + dy * dy);
		var percent = (dx * (x - lineInfo.startX) + dy * (y - lineInfo.startY)) / (length * length);
		var distance = (dx * (y - lineInfo.startY) - dy * (x - lineInfo.startX)) / length;
		return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding); 
  }

}

class SelfArrow {
  circle: Circle;
  anchorAngle: number;
  mouseOffsetAngle: number;
  text: string;

  constructor(pointsToCircle: Circle, point: {x: number, y: number}) {
    this.circle = pointsToCircle;
    this.anchorAngle = 0;
    this.mouseOffsetAngle = 0;
    this.text = '';

    if (point) {
      this.setAnchorPoint(point.x, point.y);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    var arcInfo = this.getEndPointsAndCircle();
    // draw arc
    ctx.beginPath();
    ctx.arc(arcInfo.circleX, arcInfo.circleY, arcInfo.circleRadius, arcInfo.startAngle, arcInfo.endAngle, false);
    ctx.stroke();
    // Draw the text on the loop farthest from the circle
    var textX = arcInfo.circleX + arcInfo.circleRadius * Math.cos(this.anchorAngle);
		var textY = arcInfo.circleY + arcInfo.circleRadius * Math.sin(this.anchorAngle);
		drawText(ctx, this.text, textX, textY, this.anchorAngle, selectedObj == this);
		// draw the head of the arrow
		drawArrow(ctx, arcInfo.endX, arcInfo.endY, arcInfo.endAngle + Math.PI * 0.4);
  }

  setMouseStart(x: number, y: number): void {
    this.mouseOffsetAngle = this.anchorAngle - Math.atan2(y - this.circle.y, x - this.circle.x);
  }

	setAnchorPoint(x: number, y: number) {
		this.anchorAngle = Math.atan2(y - this.circle.y, x - this.circle.x) + this.mouseOffsetAngle;
		// snap to 90 degrees
		var snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
		if (Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
		// keep in the range -pi to pi so our containsPoint() function always works
		if (this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
		if (this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
	}
	getEndPointsAndCircle() {
		var circleX = this.circle.x + 1.5 * nodeRadius * Math.cos(this.anchorAngle);
		var circleY = this.circle.y + 1.5 * nodeRadius * Math.sin(this.anchorAngle);
		var circleRadius = 0.75 * nodeRadius;
		var startAngle = this.anchorAngle - Math.PI * 0.8;
		var endAngle = this.anchorAngle + Math.PI * 0.8;
		var startX = circleX + circleRadius * Math.cos(startAngle);
		var startY = circleY + circleRadius * Math.sin(startAngle);
		var endX = circleX + circleRadius * Math.cos(endAngle);
		var endY = circleY + circleRadius * Math.sin(endAngle);
		return {
			'hasCircle': true,
			'startX': startX,
			'startY': startY,
			'endX': endX,
			'endY': endY,
			'startAngle': startAngle,
			'endAngle': endAngle,
			'circleX': circleX,
			'circleY': circleY,
			'circleRadius': circleRadius
		};
	}
  containsPoint(x: number, y:number) {
		var stuff = this.getEndPointsAndCircle();
		var dx = x - stuff.circleX;
		var dy = y - stuff.circleY;
		var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
		return (Math.abs(distance) < hitTargetPadding);
	}
}

class Arrow {
  startCircle: Circle;
  endCircle: Circle;
  text: string;
  lineAngleAdjust: number; // value to add to textAngle when link is straight line
  parallelPart: number;
  perpendicularPart: number;


  constructor(startCircle: Circle, endCircle: Circle) {
    this.startCircle = startCircle;
    this.endCircle = endCircle;
    this.text = '';
    this.lineAngleAdjust = 0;
    // Make anchor point relative to the locations of start and end circles
    this.parallelPart = 0.5; // percent from start to end circle
    this.perpendicularPart = 0; // pixels from start to end circle
  }

	getAnchorPoint() {
		var dx = this.endCircle.x - this.startCircle.x;
		var dy = this.endCircle.y - this.startCircle.y;
		var scale = Math.sqrt(dx * dx + dy * dy);
		return {
			'x': this.startCircle.x + dx * this.parallelPart - dy * this.perpendicularPart / scale,
			'y': this.startCircle.y + dy * this.parallelPart + dx * this.perpendicularPart / scale
		};
	}

	setAnchorPoint(x: number, y: number) {
		var dx = this.endCircle.x - this.startCircle.x;
		var dy = this.endCircle.y - this.startCircle.y;
		var scale = Math.sqrt(dx * dx + dy * dy);
		this.parallelPart = (dx * (x - this.startCircle.x) + dy * (y - this.startCircle.y)) / (scale * scale);
		this.perpendicularPart = (dx * (y - this.startCircle.y) - dy * (x - this.startCircle.x)) / scale;
		// snap to a straight line
		if (this.parallelPart > 0 && this.parallelPart < 1 && Math.abs(this.perpendicularPart) < snapToPadding) {
			this.lineAngleAdjust = (this.perpendicularPart < 0 ? 1 : 0) * Math.PI;
			this.perpendicularPart = 0;
		}
	}

	getEndPointsAndCircle() {
		if (this.perpendicularPart == 0) {
			var midX = (this.startCircle.x + this.endCircle.x) / 2;
			var midY = (this.startCircle.y + this.endCircle.y) / 2;
			var start = this.startCircle.closestPointOnCircle(midX, midY);
			var end = this.endCircle.closestPointOnCircle(midX, midY);
			return {
				'hasCircle': false,
				'startX': start.x,
				'startY': start.y,
				'endX': end.x,
				'endY': end.y,
			};
		}

		var anchor = this.getAnchorPoint();
		var circle = circleFromThreePoints(this.startCircle.x, this.startCircle.y, this.endCircle.x, this.endCircle.y, anchor.x, anchor.y);
		var isReversed = (this.perpendicularPart > 0);
		var reverseScale = isReversed ? 1 : -1;
		var startAngle = Math.atan2(this.startCircle.y - circle.y, this.startCircle.x - circle.x) - reverseScale * nodeRadius / circle.radius;
		var endAngle = Math.atan2(this.endCircle.y - circle.y, this.endCircle.x - circle.x) + reverseScale * nodeRadius / circle.radius;
		var startX = circle.x + circle.radius * Math.cos(startAngle);
		var startY = circle.y + circle.radius * Math.sin(startAngle);
		var endX = circle.x + circle.radius * Math.cos(endAngle);
		var endY = circle.y + circle.radius * Math.sin(endAngle);
		return {
			'hasCircle': true,
			'startX': startX,
			'startY': startY,
			'endX': endX,
			'endY': endY,
			'startAngle': startAngle,
			'endAngle': endAngle,
			'circleX': circle.x,
			'circleY': circle.y,
			'circleRadius': circle.radius,
			'reverseScale': reverseScale,
			'isReversed': isReversed,
		};
	}

	draw(ctx: CanvasRenderingContext2D) {
		var pointInfo = this.getEndPointsAndCircle();
		// draw arc
		ctx.beginPath();
		if (pointInfo.hasCircle && pointInfo.circleX) {
			ctx.arc(pointInfo.circleX, pointInfo.circleY, pointInfo.circleRadius, pointInfo.startAngle, pointInfo.endAngle, pointInfo.isReversed);
		} else {
			ctx.moveTo(pointInfo.startX, pointInfo.startY);
			ctx.lineTo(pointInfo.endX, pointInfo.endY);
		}
		ctx.stroke();
		// draw the head of the arrow
		if (pointInfo.hasCircle && pointInfo.endAngle) {
			drawArrow(ctx, pointInfo.endX, pointInfo.endY, pointInfo.endAngle - pointInfo.reverseScale * (Math.PI / 2));
		} else {
			drawArrow(ctx, pointInfo.endX, pointInfo.endY, Math.atan2(pointInfo.endY - pointInfo.startY, pointInfo.endX - pointInfo.startX));
		}
    if (pointInfo.hasCircle) {
      var startAngle = pointInfo.startAngle;
      var endAngle = pointInfo.endAngle;
      if (endAngle != null && startAngle != null&& endAngle < startAngle) {
        endAngle += Math.PI * 2;
      }
      if (startAngle != null && endAngle != null && pointInfo.circleRadius != null){
        var textAngle = (startAngle + endAngle) / 2 + (pointInfo.isReversed ? 1 : 0) * Math.PI;
        var textX = pointInfo.circleX + pointInfo.circleRadius * Math.cos(textAngle);
        var textY = pointInfo.circleY + pointInfo.circleRadius * Math.sin(textAngle);
        drawText(ctx, this.text, textX, textY, textAngle, selectedObj == this);
      }
    } else {
      var textX = (pointInfo.startX + pointInfo.endX) / 2;
      var textY = (pointInfo.startY + pointInfo.endY) / 2;
      var textAngle = Math.atan2(pointInfo.endX - pointInfo.startX, pointInfo.startY - pointInfo.endY);
      drawText(ctx, this.text, textX, textY, textAngle + this.lineAngleAdjust, selectedObj == this);
    }
	}

	containsPoint(x: number, y: number) {
		var stuff = this.getEndPointsAndCircle();
		if (stuff.hasCircle && stuff.circleX) {
			var dx = x - stuff.circleX;
			var dy = y - stuff.circleY;
			var distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
			if (Math.abs(distance) < hitTargetPadding) {
				var angle = Math.atan2(dy, dx);
				var startAngle = stuff.startAngle;
				var endAngle = stuff.endAngle;
				if (stuff.isReversed) {
					var temp = startAngle;
					startAngle = endAngle;
					endAngle = temp;
				}
				if (endAngle < startAngle) {
					endAngle += Math.PI * 2;
				}
				if (angle < startAngle) {
					angle += Math.PI * 2;
				} else if (angle > endAngle) {
					angle -= Math.PI * 2;
				}
				return (angle > startAngle && angle < endAngle);
			}
		} else {
        var dx = stuff.endX - stuff.startX;
        var dy = stuff.endY - stuff.startY;
        var length = Math.sqrt(dx * dx + dy * dy);
        var percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
        var distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;
        return (percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding);
      }
      return false;
    }
  }


function setupDfaCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    // ctx?.translate(0.5, 0.5);

    for (var circle = 0; circle < circles.length; circle++) {
      ctx.lineWidth= 1;
      ctx.fillStyle = ctx.strokeStyle = (circles[circle] == selectedObj) ? highlight : base;
      circles[circle].draw(ctx);
    }

    for (var arrow = 0; arrow < arrows.length; arrow++) {
      ctx.lineWidth = 1;
      ctx.fillStyle = ctx.strokeStyle = (arrows[arrow] == selectedObj) ? highlight : base;
      arrows[arrow].draw(ctx);
    }

    if (tempArrow != null) {
      ctx.lineWidth = 1;
      ctx.fillStyle = ctx.strokeStyle = base;
      tempArrow.draw(ctx);
    }
  }

  /* Event Handlers */
  canvas.addEventListener('mousedown', (event: MouseEvent) => {
    var mouse = getMousePos(event)
    selectedObj = mouseCollision(mouse.x, mouse.y);
    dragging = false;
    startClick = mouse;

    if (selectedObj != null) {
      if (shiftPressed && selectedObj instanceof Circle) {
        // Draw a SelfArrow to the selected circle
        tempArrow = new SelfArrow(selectedObj, mouse);
      } else {
        dragging = true;
        if (selectedObj instanceof Circle || selectedObj instanceof SelfArrow) {
          selectedObj.setMouseStart(mouse.x, mouse.y);
        }
      }
    } else if (shiftPressed) {
      // Cosmetic arrow logic for interactive response
      tempArrow = new TemporaryArrow(mouse, mouse);
    }

    draw();
  });


  canvas.addEventListener('dblclick', (event) => {
    var mouse = getMousePos(event);
    selectedObj = mouseCollision(mouse.x, mouse.y);

    if (selectedObj == null) {
      selectedObj = new Circle(mouse.x, mouse.y);
      if (selectedObj instanceof Circle) {
        circles.push(selectedObj);
        draw();
      }
    } else if (selectedObj instanceof Circle) {
      selectedObj.isAccept = !selectedObj.isAccept;
      draw();
    }
  });

  canvas.addEventListener('mousemove', (event) => {
    var mouse = getMousePos(event);

    if (tempArrow != null) {
      var targetCircle = mouseCollision(mouse.x, mouse.y);
      if (!(targetCircle instanceof Circle)) {
        targetCircle = null;
      }

      if (selectedObj == null && startClick != null) {
        if (targetCircle != null && targetCircle instanceof Circle) {
          tempArrow = new EntryArrow(targetCircle, startClick);
        } else {
          tempArrow = new TemporaryArrow(startClick, mouse);
        }
      } else {
        if (targetCircle == selectedObj && targetCircle instanceof Circle) {
          tempArrow = new SelfArrow(targetCircle, mouse);
        } else if (targetCircle != null && selectedObj instanceof Circle && targetCircle instanceof Circle) {
          tempArrow = new Arrow(selectedObj, targetCircle);
        } else if (selectedObj instanceof Circle) {
          tempArrow = new TemporaryArrow(selectedObj.closestPointOnCircle(mouse.x, mouse.y), mouse);
        }
      }
      draw();
    }

    if (dragging) {
      selectedObj?.setAnchorPoint(mouse.x, mouse.y);
      if (selectedObj instanceof Circle) {
        snapAlignCircle(selectedObj);
      }
      draw();
    }
  });

  canvas.addEventListener('mouseup', (event) =>{
    dragging = false;

    if (tempArrow != null) {
      if(!(tempArrow instanceof TemporaryArrow)) { 
        // When adding the tempArrow to the arrows array, 
        // Check if a self arrow points to the selected circle already
        
        if (tempArrow instanceof SelfArrow) {
          var hasSelfArrow = false
          for (var i = 0; i < arrows.length; i++) {
            var arrow = arrows[i];
            if (arrow instanceof SelfArrow) {
              if (arrow.circle == selectedObj) {
                hasSelfArrow = true;
                break;
              }
            }
          }
          if (!hasSelfArrow) {
            selectedObj = tempArrow;
            arrows.push(tempArrow);
          }
        } else if (tempArrow instanceof EntryArrow) {
          var hasEntryArrow = false;
          for (var i = 0; i < arrows.length; i++) {
            if (arrows[i] instanceof EntryArrow) {
              hasEntryArrow = true;
              break;
            }
          }
          if (!hasEntryArrow) {
            selectedObj = tempArrow;
            arrows.push(tempArrow);
          }
        } else {
          selectedObj = tempArrow;
          arrows.push(tempArrow);
        }
        
      }
      tempArrow = null;
    }

    draw();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Shift') {
      shiftPressed = true;
    } 

    if (selectedObj != null && 'text' in selectedObj) {
      if(event.key === 'Backspace') {
        selectedObj.text = selectedObj.text.substring(0, selectedObj.text.length - 1);
        draw();
      } else if (event.key === 'Delete') {
        for (var circ = 0; circ < circles.length; circ++) {
          if (circles[circ] == selectedObj) {
            circles.splice(circ--, 1);
          }
        }
        for (var i = 0; i < arrows.length; i++) {
          const arrow = arrows[i];
          if (arrow == selectedObj) {
            arrows.splice(i--, 1);
          }
          if (arrow instanceof SelfArrow) {
            if (arrow.circle == selectedObj){
              arrows.splice(i--, 1);
            }
          }
          if (arrow instanceof EntryArrow) {
            if (arrow.pointsToCircle == selectedObj) {
              arrows.splice(i--, 1);
            }
          }
          if (arrow instanceof Arrow) {
            if (arrow.startCircle == selectedObj || arrow.endCircle == selectedObj) {
              arrows.splice(i--, 1)
            }
          } 
        }
        draw();
      } else {
        if (event.key.length === 1) {
          selectedObj.text += event.key;
          draw()
        }
      }
    }
    
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') {
      shiftPressed = false;
    }
  })

  /* Helper Functions*/

  // Align the input circle to any circle in the array if x or y absolute is less than padding
  function snapAlignCircle(circle: Circle) {
    for(var circ = 0; circ < circles.length; circ++) {
      if(circles[circ] == circle) continue;

      if(Math.abs(circle.x - circles[circ].x) < snapToPadding) {
        circle.x = circles[circ].x;
      }

      if(Math.abs(circle.y - circles[circ].y) < snapToPadding) {
        circle.y = circles[circ].y;
      }
    }
  }

  // Get the current mouse position inside the canvas
  const getMousePos = (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  // Get the collided object at the point x, y
  function mouseCollision(x: number, y: number) {
    for(var circ = 0; circ < circles.length; circ++) {
      if(circles[circ].containsPoint(x, y)) {
        return circles[circ];
      }
    }
    for(var arrow = 0; arrow < arrows.length; arrow++) {
      if (arrows[arrow].containsPoint(x, y)) {
        return arrows[arrow];
      }
    }

    return null;
  }
}

/* -----------------------------------------------------------
 * Attach automatically when DOM is ready.
 * --------------------------------------------------------- */
function attachWhenReady() {
  const run = () => {
    const canvas = document.getElementById('DFACanvas') as HTMLCanvasElement | null;
    if (canvas)  {
      setupDfaCanvas(canvas)
    };
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run(); // DOM is already ready
  }
}

attachWhenReady();
