import Log from 'common/log';
import Entity from 'common/entity.js';
import Utils from 'common/utils';
import Vector from 'common/vector';

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

		this._position = this.options.start.copy();
	}

	pos() {
		return this._position.copy();
	}

	move() {
		if (!this.target) {
			return;
		}

		let pos = this.pos();
		let target = this.target.copy().sub(pos);

		if (!target.x && !target.y) {
			return;
		}

		let dist = target.magnitude();
		let delta = target.fromSelfAngle(this._speed);

		let radius = this.radius;
		let deltaDist = dist / (50 + radius);

		if (dist < (50 + this.radius)) {
			delta.multBy(deltaDist);
		}

		this._position.add(delta);

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
		if (this.target.isEqual(this._position)) {
			return;
		}

		this.target = this._position.copy();
	}
}

export default Element;
