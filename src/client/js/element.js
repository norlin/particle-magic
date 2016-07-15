//import 'fabric'
import GObject from './object.js'

class GElement extends GObject {
	constructor(game, options) {
		super(game, options)

		this.initParams();
		this.el = this.createEl();
	}

	createEl() {
		return new fabric.Circle({left: this._position.x, top: this._position.y});
	}

	initParams() {
		this.maxSpeed = {x: 30, y: 30};
		this._speed = {x: 0, y: 0};
		this._position = {x: 0, y: 0};
	}

	pos() {
		return this._position;
	}

	speed(x, y) {
		if (typeof x == 'undefined' && typeof y == 'undefined') {
			return this._speed;
		}

		if (typeof x == 'string' && typeof y == 'undefined') {
			return this._speed[x];
		}

		if (typeof x == 'string' && typeof y == 'number') {
			this._speed[x] = y;
			return;
		}

		if (typeof x == 'object') {
			if (typeof x.x == 'number') {
				this._speed.x = x.x;
			}

			if (typeof x.y == 'number') {
				this._speed.y = x.y;
			}

			return;
		}

		if (typeof x == 'number') {
			this._speed.x = x;
		}

		if (typeof y == 'number') {
			this._speed.y = y;
		}
	}

	accelerate(x, y) {
		let speed = this.speed();

		var newX = speed.x + x;
		newX = Math.min(this.maxSpeed.x, newX);
		newX = Math.max(-this.maxSpeed.x, newX);

		var newY = speed.y + y;
		newY = Math.min(this.maxSpeed.y, newY);
		newY = Math.max(-this.maxSpeed.y, newY);

		this.speed(Math.abs(newX) < 5 ? 0 : newX, Math.abs(newY) < 5 ? 0 : newY)
	}

	deccelerate(x, y) {
		let speed = this.speed();

		if (speed.x > 0) {
			x = x * -1;
		} else if (speed.x == 0) {
			x = 0;
		}

		if (speed.y > 0) {
			y = y * -1;
		} else if (speed.y == 0) {
			y = 0;
		}

		if (x || y) {
			this.accelerate(x, y);
		}
	}

	tick() {
		// process position
		let fps = this.game.options.fps;
		let speed = this.speed();
		let tickSpeed = {x: speed.x / fps, y: speed.y / fps};

		this._position.x += tickSpeed.x;
		this._position.y += tickSpeed.y;

		//this.deccelerate(speed.x / 100, speed.y / 100);
	}

	draw(x, y) {
		this.el.set('left', x);
		this.el.set('top', y);

		this.el.setCoords();
	}
}

export default GElement;
