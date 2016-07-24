import GObject from 'common/object.js';
import Utils from 'common/utils';

class GElement extends GObject {
	constructor(game, options) {
		super(game, options);

		this.initParams();
	}

	initParams() {
		this.color = this.options.color || Utils.getRandomColor();

		this.radius = this.options.radius;

		this._speed = this.options.speed || 6.25;

		this._position = {
			x: this.options.startX || 0,
			y: this.options.startY || 0
		};
	}

	pos() {
		return {
			x: this._position.x,
			y: this._position.y
		};
	}

	move() {
		if (!this.target) {
			return;
		}

		let pos = this.pos();

		let target = {
			x: this.target.x - pos.x,
			y: this.target.y - pos.y
		};

		if (!target.x && !target.y) {
			return;
		}

		let slowDown = 1;

		let dist = Math.sqrt(Math.pow(target.y, 2) + Math.pow(target.x, 2));
		let deg = Math.atan2(target.y, target.x);

		let deltaX = this._speed * Math.cos(deg) / slowDown;
		let deltaY = this._speed * Math.sin(deg) / slowDown;

		let radius = this.radius;
		let delta = dist / (50 + radius);

		if (dist < (50 + this.radius)) {
			deltaX *= delta;
			deltaY *= delta;
		}

		this._position.x += deltaX;
		this._position.y += deltaY;

		let min = 0 + this.radius;
		let width = this.game.config.width;
		let height = this.game.config.height;
		let maxX = width - this.radius;
		let maxY = height - this.radius;

		if (this._position.x < min) {
			this._position.x = min;
			this.target.x = this._position.x;
		} else if (this._position.x >= maxX) {
			this._position.x = maxX;
			this.target.x = this._position.x;
		}

		if (this._position.y < min) {
			this._position.y = min;
			this.target.y = this._position.y;
		} else if (this._position.y >= maxY) {
			this._position.y = maxY;
			this.target.y = this._position.y;
		}
	}

	area() {
		let radius = this.radius || 1;
		let size = radius * 2;

		return {
			x: this._position.x - radius,
			y: this._position.y - radius,
			w: size,
			h: size,
			id: this.id,
			radius: radius,
			centerX: this._position.x,
			centerY: this._position.y
		};
	}

	stopMovement() {
		if (this.target.x == this._position.x && this.target.y == this._position.y) {
			return;
		}

		this.target.x = this._position.x;
		this.target.y = this._position.y;
	}
}

export default GElement;
