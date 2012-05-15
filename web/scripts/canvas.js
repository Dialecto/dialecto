Context2D = function (canvasId) {
	this.canvasId = canvasId;
	this.canvas = document.getElementById(canvasId);
	this.context = this.canvas.getContext("2d");
	this.fontSize = 17;
	this.fontFamily = "Arial";
	this.fillStyle = "rgba(255,255,255,.5)";
	this.textFillStyle = "black";
	this.strokeWidth = 2;
}
Context2D.prototype = p = Context2D.prototype;

p.translate = function (x, y) {
	if (x instanceof Point2D) {
		y = x.y;
		x = x.x;
	}
	this.context.translate (x, y);
}

p.beginPath = function () {
	this.context.beginPath();
}

p.moveTo = function (x, y) {
	if (x instanceof Point2D) {
		y = x.y;
		x = x.x;
	}
	this.context.moveTo (x, y);
}

p.lineTo = function (x, y) {
	if (x instanceof Point2D) {
		y = x.y;
		x = x.x;
	}
	this.context.lineTo (x, y);
}

p.closePath = function () {
	this.context.closePath();
}

p.fill = function () {
	this.context.fill ();
}

p.stroke = function () {
	this.context.stroke ();
}

p.setStrokeWidth = function (width) {
	this.strokeWidth = width;
	this.context.lineWidth = width;
}

p.measureText = function (text) {
	return new Size2D (this.context.measureText(text).width, this.fontSize);
}

p.fillText = function (text, x, y) {
	if (x instanceof Point2D) {
		y = x.y;
		x = x.x;
	}
	this.context.fillStyle = this.textFillStyle;
	this.context.fillText (text, x? x: 0, (y? y: 0) + this.fontSize);
	this.context.fillStyle = this.fillStyle;
}

p.setFont = function (size, family) {
	this.fontSize = size;
	this.fontFamily = family;
	this.context.font = size + "px " + family;
}

p.drawArrow = function (x1, y1, x2, y2, weight, color) {
	var ctx = this.context;
	if (color) {
		ctx.fillStyle = color;
	}
	var dir = new Point2D(x2 - x1, y2 - y1).normalize();
	var normal = dir.getNormal();
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x1 + (dir.x + normal.x / 2) * weight, y1 + (dir.y + normal.y / 2) * weight);
	ctx.lineTo(x1 + (dir.x + normal.x / 2) * weight, y1 + (dir.y - normal.y / 2) * weight);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	if (color) {
		ctx.fillStyle = this.fillStyle;
	}
}

p.drawCircle = function(x, y, radius) {
	var ctx = this.context;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0 , 2 * Math.PI, false);
	ctx.fill();
	ctx.stroke();
}

p.setFillStyle = function (style) {
	this.fillStyle = style;
	this.context.fillStyle = style;
}

p.setTextFillStyle = function (style) {
	this.textFillStyle = style;
}

p.reset = function () {
	this.setFont(this.fontSize, this.fontFamily);
	this.setFillStyle(this.fillStyle);
	this.setTextFillStyle(this.textFillStyle);
	this.setStrokeWidth(this.strokeWidth);
}

Size2D = function (width, height) {
	this.width = width;
	this.height = height;
}

Size2D.prototype.addHorizontally = function (size, times) {
	this.width += size.width * (times == undefined? 1: times);
	this.height = Math.max(this.height, size.height);
	return this;
}

Size2D.prototype.addVertically = function (size, times) {
	this.width = Math.max(this.width, size.width);
	this.height += size.height * (times == undefined? 1: times);
	return this;
}

Size2D.prototype.copy = function () {
	return new Size2D (this.width, this.height);
}

Point2D = function (x, y) {
	this.x = x;
	this.y = y;
}

Point2D.prototype.copy = function () {
	return new Point2D (this.x, this.y);
}

Point2D.prototype.normalize = function () {
	len = Math.sqrt(this.x * this.x + this.y * this.y);
	this.x /= len;
	this.y /= len;
	return this;
}

Point2D.prototype.translate = function (x, y) {
	this.x += x;
	this.y += y;
	return this;
}

Point2D.prototype.scale = function (s) {
	this.x *= s;
	this.y *= s;
	return this;
}

Point2D.prototype.round = function () {
	this.x = Math.round(this.x);
	this.y = Math.round(this.y);
	return this;
}

Point2D.prototype.getNormal = function () {
	return new Point2D(-this.y, this.x);
}

Rect = function (size, origin, dx, dy) {
	this.size = size;
	if (origin) {
		this.origin = origin.copy();
	}
	else {
		this.origin = new Point2D(-size.width / 2, 0);
	}
	if (dx) {
		this.origin.x += dx;
	}
	if (dy) {
		this.origin.y += dy;
	}
}

Rect.prototype.translate = function (x, y) {
	if (x instanceof Point2D) {
		y = x.y;
		x = x.x;
	}
	this.origin.x += x;
	this.origin.y += y;
	return this;
}

Rect.prototype.getTopLeft = function () {
	return this.origin.copy();
}

Rect.prototype.getTopMiddle = function () {
	return new Point2D(this.origin.x + this.size.width / 2, this.origin.y);
}

Rect.prototype.getTopRight = function () {
	return new Point2D(this.origin.x + this.size.width, this.origin.y);
}

Rect.prototype.getMiddleLeft = function () {
	return new Point2D(this.origin.x, this.origin.y + this.size.height / 2);
}

Rect.prototype.getMiddle = function () {
	return new Point2D(this.origin.x + this.size.width / 2,
	                   this.origin.y + this.size.height / 2);
}

Rect.prototype.getMiddleRight = function () {
	return new Point2D(this.origin.x + this.size.width,
	                   this.origin.y + this.size.height / 2);
}

Rect.prototype.getBottomLeft = function () {
	return new Point2D(this.origin.x, this.origin.y + this.size.height);
}

Rect.prototype.getBottomMiddle = function () {
	return new Point2D(this.origin.x + this.size.width / 2,
	                   this.origin.y + this.size.height);
}

Rect.prototype.getBottomRight = function () {
	return new Point2D(this.origin.x + this.size.width,
	                   this.origin.y + this.size.height);
}

Rect.prototype.pointInside = function (x, y) {
	if (x instanceof Point2D) {
		y = x.y;
		x = x.x;
	}
	return (x >= this.origin.x) && (x <= this.origin.x + this.size.width)
	    && (y >= this.origin.y) && (y <= this.origin.y + this.size.height);
}

// Canvas additions

HTMLCanvasElement.prototype.pointWithEvent = function (event) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do {
        totalOffsetX += currentElement.offsetLeft;
        totalOffsetY += currentElement.offsetTop;
    }
    while (currentElement = currentElement.offsetParent)

    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;

    return new Point2D (canvasX, canvasY);
}
