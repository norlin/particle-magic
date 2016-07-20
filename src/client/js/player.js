import Log from 'common/log';
import GElement from './element';
import Keys from './keys';

let log = new Log('Player');

class GPlayer extends GElement {
	constructor(game, options) {
		super(game, options);

		this.addListeners();
	}

	initParams() {
		super.initParams();

		this.target = {
			x: this._position.x,
			y: this._position.y
		};
	}

	addListeners() {
		this.game.addClickListener((point) => {
			if (this.target.mark) {
				this.target.mark.remove();
			}

			this.target = {
				x: point.x - this.radius,
				y: point.y - this.radius
			};

			let markPos = this.game.toScreenCoords(this.target.x, this.target.y);

			this.target.mark = new fabric.Circle({
				radius: 2,
				fill: this.options.color,
				left: markPos.x,
				top: markPos.y
			});
		}, true);
	}

	move() {
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
	}

	stopMovement() {
		if (this.target.x == this._position.x && this.target.y == this._position.y) {
			return;
		}

		log.info('stopMovement');

		this.target.x = this._position.x;
		this.target.y = this._position.y;

		if (this.target.mark) {
			this.target.mark.remove();
			this.target.mark = undefined;
		}
	}

	tick() {
		// moves calculated on server
		//this.move();

		let pos = this.pos();
		if (Math.abs(pos.x - this.target.x) < 1 && Math.abs(pos.y - this.target.y) < 1) {
			this.stopMovement();
		} else {
			let markPos = this.game.toScreenCoords(this.target.x + this.radius, this.target.y + this.radius);

			if (this.target.mark) {
				this.target.mark.set('left', markPos.x);
				this.target.mark.set('top', markPos.y);
				this.target.mark.setCoords();
			}
		}

		this.draw(pos.x, pos.y);
	}
}

export default GPlayer;
