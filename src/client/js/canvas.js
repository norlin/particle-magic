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

	strokeCircle(x, y, radius, color) {
		let ctx = this.ctx;

		ctx.beginPath();
		ctx.arc(x, y, radius, 0, this.pi2, false);
		ctx.lineWidth = 3;
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

	drawLine(x, y, vector, distance, color) {
		let ctx = this.ctx;

		let x2 = x + Math.sin(vector) * distance;
		let y2 = y + Math.cos(vector) * distance;

		ctx.beginPath();
		ctx.moveTo(x, y);
		ctx.lineTo(x2, y2);
		ctx.setLineDash([5]);
		ctx.strokeStyle = color || '#000';
		ctx.stroke();
		ctx.setLineDash([]);
	}
}

export default Canvas;
