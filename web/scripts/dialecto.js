//  Dialecto
//  dialecto.js

Dialecto = {
}

// Base Element
Dialecto.Element = function () {
}
p = Dialecto.Element.prototype;

p.separator = new Size2D (7, 7);

p.drawAt = function (ctx, x, y) {
	if (x instanceof Rect) {
		x = x.getTopMiddle();
	}
	if (x instanceof Point2D) {
		y = x.y;
		x = x.x;
	}
	x = Math.round(x);
	y = Math.round(y);
	ctx.translate(x, y);
	this.draw(ctx);
	ctx.translate(-x, -y);
}

p.getRect = function (ctx, x, y) {
	return new Rect(this.getSize(ctx));
}

p.pointInside = function (ctx, x, y) {
	return this.getRect(ctx).pointInside(x, y);
}

p.hitTest = function (ctx, x, y) {
	if (this.pointInside(ctx, x, y)) {
		return [this];
	}
	return null;
}

// Container Element
Dialecto.ContainerElement = function () {
}
Dialecto.ContainerElement.prototype = p = new Dialecto.Element();

p.hitTest = function (ctx, x, y) {
	if (x instanceof Point2D) {
		y = x.y;
		x = x.x;
	}
	if (this.pointInside(ctx, x, y)) {
		var retval = this.hitTestChild(ctx, x, y);
		if (retval) {
			retval.push (this);
			return retval;
		}
		return [this];
	}
	return null;
}

// Assignment
Dialecto.Assignment = function (left, right) {
	this.left = left;
	this.right = right;
}
Dialecto.Assignment.prototype = p = new Dialecto.Element();

p.draw = function (ctx) {
	var r = this.getRect(ctx);
	var x = r.origin.x;
	ctx.fillText(this.left, x);
	x += ctx.measureText(this.left).width;
	x += this.separator.width;
	ctx.drawArrow(x, r.size.height / 2, x + this.arrowSize.width, r.size.height / 2, this.arrowWeight, this.arrowColor);
	x += this.arrowSize.width;
	x += this.separator.width;
	ctx.fillText(this.right, x);
}

p.getSize = function (ctx) {
	return ctx.measureText(this.left)
		.addHorizontally (this.separator)
		.addHorizontally (this.arrowSize)
		.addHorizontally (this.separator)
		.addHorizontally (ctx.measureText(this.right));
}

p.arrowSize = new Size2D (20, 9);
p.arrowWeight = 9;
p.arrowColor = "white";

// Sequence
Dialecto.Sequence = function () {
	this.elements = [];
}
Dialecto.Sequence.prototype = p = new Dialecto.ContainerElement();

p.add = function (element) {
	this.elements.push (element);
}

p.draw = function (ctx) {
	var y = this.separator.height;
	ctx.translate(0, y);
	for (i in this.elements) {
		var element = this.elements[i];
		var height = element.getSize(ctx).height + this.separator.height;
		element.draw(ctx);
		ctx.translate(0, height);
		y += height;
	}
	ctx.translate (0, -y);
}

p.getSize = function (ctx) {
	var size = this.separator.copy();
	for (i in this.elements) {
		var element = this.elements[i];
		size.addVertically (element.getSize(ctx)).addVertically(this.separator);
	}
	return size.addHorizontally(this.separator, 2);
}

p.hitTestChild = function (ctx, x, y) {
	var dy = this.separator.height;
	for (i in this.elements) {
		var element = this.elements[i];
		var height = element.getSize(ctx).height + this.separator.height;
		var retval = element.hitTest(ctx, x, y - dy);
		if (retval) {
			return retval;
		}
		dy += height;
	}
	return null;
}

p.hitTestInRect = function (ctx, x, y, rect) {
	if (rect.pointInside(x, y)) {
		var p = rect.getTopMiddle();
		return this.hitTest(ctx, x - p.x, y - p.y);
	}
	return null;
}

p.pointInside = function () {
	return true;
}

// If
Dialecto.If = function (condition) {
	this.condition = condition;
	this.left = new Dialecto.Sequence();
	this.right = new Dialecto.Sequence();
}
Dialecto.If.prototype = p = new Dialecto.ContainerElement();

p.getRects = function (ctx) {
	var conditionSize = ctx.measureText(this.condition);
	var topSize = this.separator.copy().addVertically(conditionSize, 2);
	var leftSize = this.left.getSize(ctx);
	var rightSize = this.right.getSize(ctx);
	var bottomSize = leftSize.copy().addHorizontally(rightSize);
	bottomSize.width = Math.max(bottomSize.width, topSize.width);
	var yBottom = topSize.height;
	var bottomWeight = (leftSize.width + rightSize.width) / bottomSize.width;
	leftSize.width = Math.round(leftSize.width / bottomWeight);
	rightSize.width = Math.round(rightSize.width / bottomWeight);
	leftSize.height = rightSize.height = bottomSize.height;
	return {
		condition: new Rect(conditionSize).translate(0, conditionSize.height),
		top: new Rect(topSize),
		left: new Rect(leftSize).translate((-bottomSize.width + leftSize.width) / 2, yBottom),
		right: new Rect(rightSize).translate((bottomSize.width - rightSize.width) / 2, yBottom),
		bottom: new Rect(bottomSize).translate(0, yBottom),
		size: new Rect(bottomSize.copy().addVertically(topSize))
	};
}

p.draw = function (ctx) {
	var r = this.getRects(ctx);
	
	ctx.beginPath();
	ctx.moveTo(r.top.getTopMiddle());
	ctx.lineTo(r.right.getTopRight());
	ctx.lineTo(r.right.getBottomRight());
	ctx.lineTo(r.left.getBottomLeft());
	ctx.lineTo(r.left.getTopLeft());
	ctx.closePath();
	ctx.fill ();
	ctx.moveTo(r.left.getTopLeft());
	ctx.lineTo(r.right.getTopRight());
	ctx.moveTo(r.left.getTopRight());
	ctx.lineTo(r.left.getBottomRight());
	
	ctx.stroke ();
	ctx.fillText (this.condition, r.condition.origin.x, r.condition.origin.y);
	this.left.drawAt (ctx, r.left);
	this.right.drawAt (ctx, r.right);
}

p.getSize = function (ctx) {
	return this.left.getSize(ctx)
		.addHorizontally (this.right.getSize(ctx))
		.addVertically (ctx.measureText(this.condition), 2)
		.addVertically (this.separator);
}

p.hitTestChild = function (ctx, x, y) {
	var r = this.getRects(ctx);
	return this.left.hitTestInRect(ctx, x, y, r.left)
	    || this.right.hitTestInRect(ctx, x, y, r.right);
}

// While
Dialecto.While = function (condition) {
	this.condition = condition;
	this.sequence = new Dialecto.Sequence();
}
Dialecto.While.prototype = p = new Dialecto.ContainerElement();

p.draw = function (ctx) {
	var conditionSize = ctx.measureText(this.condition);
	var topSize = this.separator.copy().addVertically(conditionSize);
	var size = this.getSize(ctx);
	
	ctx.beginPath();
	ctx.moveTo(-size.width / 2, 0);
	ctx.lineTo(size.width / 2, 0);
	ctx.lineTo(size.width / 2, size.height);
	ctx.lineTo(-size.width / 2, size.height);
	ctx.closePath();
	ctx.fill ();
	ctx.moveTo(-size.width / 2, topSize.height);
	ctx.lineTo(size.width / 2, topSize.height);
	ctx.stroke ();
	
	ctx.fillText (this.condition, -conditionSize.width / 2);
	this.sequence.drawAt (ctx, 0, topSize.height);
}

p.getSize = function (ctx) {
	var size = this.sequence.getSize(ctx)
		.addVertically (ctx.measureText(this.condition))
		.addVertically (this.separator);
	return size;
}

p.hitTestChild = function (ctx, x, y) {
	var conditionSize = ctx.measureText(this.condition);
	var topSize = this.separator.copy().addVertically(conditionSize);
	return this.sequence.hitTest (ctx, 0, topSize.height);
}

// For
Dialecto.For = function (counter, begin, end) {
	this.iterator = new Dialecto.For.Iterator(counter, begin, end);
	this.sequence = new Dialecto.Sequence();
}

Dialecto.For.prototype = p = new Dialecto.Element();

p.draw = function (ctx) {
	var iteratorSize = this.iterator.getSize(ctx);
	var size = this.getSize(ctx);
		
	ctx.beginPath();
	ctx.moveTo((iteratorSize.width - size.width)/2, 0);
	ctx.lineTo(size.width/2, 0);
	ctx.lineTo(size.width/2, size.height);
	ctx.lineTo((iteratorSize.width - size.width)/2, size.height);
	ctx.lineTo((iteratorSize.width - size.width)/2, (size.height + iteratorSize.height) / 2);
	ctx.moveTo((iteratorSize.width - size.width)/2, (size.height - iteratorSize.height) / 2);
	ctx.lineTo((iteratorSize.width - size.width)/2, 0);
	//ctx.fill ();
	ctx.stroke();
	this.sequence.drawAt (ctx, iteratorSize.width / 2, 0);
	this.iterator.drawAt (ctx, (iteratorSize.width - size.width)/2, (size.height - iteratorSize.height) / 2);
}

p.getSize = function (ctx) {
	return this.sequence.getSize(ctx)
		.addHorizontally(this.iterator.getSize(ctx))
		.addHorizontally(this.separator, 4)
		.addVertically(this.separator, 2);
}

// For.Iterator
Dialecto.For.Iterator = function (counter, begin, end) {
	this.counter = counter;
	this.begin = begin;
	this.end = end;
}

Dialecto.For.Iterator.prototype = p = new Dialecto.Element();

p.getRects = function (ctx) {
	var beginRect = new Rect(ctx.measureText(this.begin));
	var endRect = new Rect(ctx.measureText(this.end));
	var counterRect = new Rect(ctx.measureText(this.counter));
	var size = beginRect.size.copy()
		.addHorizontally(endRect.size)
		.addHorizontally(this.separator, 4)
		.addVertically(counterRect.size.copy().addHorizontally(this.separator, 2))
		.addVertically(this.separator, 4);
	var maxSize = Math.max(size.width, size.height);
	var rect = new Rect(new Size2D(maxSize, maxSize));
	counterRect.origin.y = maxSize / 2 - counterRect.size.height - this.separator.height;
	beginRect.origin.y = endRect.origin.y = maxSize / 2 + this.separator.height;
	beginRect.origin.x = -(beginRect.size.width + endRect.size.height) / 2 - this.separator.width;
	endRect.origin.x = beginRect.getTopRight().x + this.separator.width * 2;
	return {
		counter: counterRect,
		begin: beginRect,
		end: endRect,
		size: rect
	};
}

p.draw = function (ctx) {
	var r = this.getRects(ctx);
	var radius = r.size.size.width / 2;
	var middleLineX = r.begin.getTopRight().x + this.separator.width;
	var middleLineMaxY = Math.sin(Math.acos(middleLineX / radius)) * radius + radius;
	
	ctx.drawCircle(0, radius, radius);
	
	ctx.beginPath();
	ctx.moveTo(-radius,radius);
	ctx.lineTo(radius,radius);
	ctx.moveTo(middleLineX,radius);
	ctx.lineTo(middleLineX,middleLineMaxY);
	ctx.stroke();

	ctx.fillText (this.counter, r.counter.getTopLeft().round());
	ctx.fillText (this.begin, r.begin.getTopLeft().round());
	ctx.fillText (this.end, r.end.getTopLeft().round());
}

p.getSize = function (ctx) {
	var size = ctx.measureText(this.begin)
		.addHorizontally(ctx.measureText(this.end))
		.addHorizontally(this.separator, 4)
		.addVertically(ctx.measureText(this.counter).addHorizontally(this.separator, 2))
		.addVertically(this.separator, 4);
	var maxSize = Math.max(size.width, size.height);
	return new Size2D(maxSize, maxSize);
}
