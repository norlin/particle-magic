import Log from 'common/log';
import Entity from 'common/entity.js';
import Utils from 'common/utils';

let log = new Log('Element');

class Element extends Entity {
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

		let width = this.game.config.width;
		let height = this.game.config.height;

		// jump behind the edges
		if (this._position.x <= 0) {
			this._position.x = width-1;
			this.target.x = width + this.target.x;
		} else if (this._position.x >= width) {
			this._position.x = 1;
			this.target.x = this.target.x - width;
		}

		if (this._position.y <= 0) {
			this._position.y = height-1;
			this.target.y = height + this.target.y;
		} else if (this._position.y >= height) {
			this._position.y = 1;
			this.target.y = this.target.y - height;
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

export default Element;