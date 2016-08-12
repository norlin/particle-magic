import Log from 'common/log';
import Vector from 'common/vector';
import Entity from 'common/entity.js';

let log = new Log('Canvas');

class Canvas extends Entity {
	constructor(game, options) {
		super(game, options);

		this.size = options.size;

		this.canvas = this.options.canvas;
		this.updateSize(this.size);

		this.init();
	}

	updateSize(size) {
		this.size = size;
		this.center = this.size.copy().divBy(2);

		this.canvas.width = this.size.x;
		this.canvas.height = this.size.y;
	}

	init() {
		if (!this.canvas) {
			throw 'No canvas found!';
		}

		this.pi2 = 2 * Math.PI;
		this.ctx = this.canvas.getContext('2d');
		this.setBackgroundColor(this.options.background);
	}

	clear() {
		this.ctx.clearRect(0, 0, this.size.x, this.size.y);
	}

	add(object) {
		if (!object.draw) {
			return;
		}

		object.draw(this);
	}

	setBackgroundColor(color) {
		this.bg = color;

		this.canvas.style.background = this.bg;
	}

	drawCircle(x, y, radius, color) {
		let ctx = this.ctx;

		ctx.beginPath();
		ctx.arc(x, y, radius, 0, this.pi2, false);
		ctx.fillStyle = color;
		ctx.fill();
	}

	strokeCircle(x, y, radius, color, width) {
		let ctx = this.ctx;

		ctx.beginPath();
		ctx.arc(x, y, radius, 0, this.pi2, false);
		ctx.lineWidth = width || 3;
		ctx.strokeStyle = color;
		ctx.stroke();
	}

	drawRect(x, y, w, h, color, stroke, strokeColor) {
		let ctx = this.ctx;

		ctx.fillStyle = color;
		ctx.fillRect(x, y, w, h);

		if (stroke) {
			ctx.lineWidth = stroke;
			ctx.strokeStyle = strokeColor || '#000';
			ctx.strokeRect(x+stroke, y+stroke, w-(stroke*2), h-(stroke*2));
		}
	}

	drawText(x, y, text, color) {
		let ctx = this.ctx;

		ctx.font = '12px Arial';
		ctx.fillStyle = color || '#000';
		ctx.fillText(text, x, y);
	}

	drawLine(options) {
		let from = options.from;
		let to = options.to;

		if (!to) {
			let angle = options.angle;
			let distance = options.distance || 100;

			to = from.copy().move(angle, distance);
		}

		let color = options.color;
		let width = options.width;
		let solid = options.solid;

		let ctx = this.ctx;

		ctx.beginPath();
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(to.x, to.y);
		if (!solid) {
			ctx.setLineDash([5]);
		}
		ctx.lineWidth = width || 1;
		ctx.strokeStyle = color || '#000';
		ctx.stroke();
		ctx.setLineDash([]);
	}
}

export default Canvas;
