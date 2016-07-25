import Log from 'common/log';
import GObject from 'common/object.js';

let log = new Log('Canvas');

class Canvas extends GObject {
	constructor(game, options) {
		super(game, options);

		this.canvas = this.options.canvas;
		this.updateSize(this.options.width, this.options.height);

		this.init();
	}

	updateSize(w, h) {
		this.canvas.width = this.width = this.options.width = w;
		this.canvas.height = this.height = this.options.height = h;

		this.centerX = this.width/2;
		this.centerY = this.height/2;
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
		this.ctx.clearRect(0, 0, this.width, this.height);
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

	drawRect(x, y, w, h, color) {
		let ctx = this.ctx;

		ctx.fillStyle = color;
		ctx.fillRect(x, y, w, h);
	}

	drawText(x, y, text, color) {
		let ctx = this.ctx;

		ctx.font = '12px Arial';
		ctx.fillStyle = color || '#000';
		ctx.fillText(text, x, y);
	}

	drawLine(options) {
		let x = options.x;
		let y = options.y;
		let vector = options.vector;
		let distance = options.distance || 100;
		let color = options.color;
		let width = options.width;
		let solid = options.solid;

		let ctx = this.ctx;

		let x2 = vector ? x + Math.sin(vector) * distance : options.x2;
		let y2 = vector ? y + Math.cos(vector) * distance : options.y2;

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x2, y2);
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
