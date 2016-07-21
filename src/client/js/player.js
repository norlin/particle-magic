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

		this.basicPower = 10;
		this.maxPower = this.basicPower * 20;
		this.power = this.basicPower;

		this.target = {
			x: this._position.x,
			y: this._position.y
		};
	}

	addListeners() {
		this.game.addClickListener((point) => {
			if (this.target.mark) {
				this.target.mark = undefined;
			}

			this.target = {
				x: point.x,
				y: point.y
			};

			let markPos = this.game.toScreenCoords(this.target.x, this.target.y);

			this.target.mark = {
				radius: 2,
				color: this.options.color,
				x: markPos.x,
				y: markPos.y
			};
		}, true);

		this.game.addKeyListener(Keys.SPACE, (event)=>{
			if (this.fire) {
				return;
			}

			if (this.accumulate) {
				this.launchFire();
			} else {
				this.accumulate = true;
			}
		});
	}

	launchFire() {
		this.accumulate = false;
		this.fire = true;
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
			this.target.mark = undefined;
		}
	}

	tick() {
		// moves calculated on server
		//this.move();

		if (this.accumulate) {
			if (this.power < this.maxPower) {
				this.power += 1;
			} else {
				this.launchFire();
			}
		} else if (this.fire) {
			if (this.power > this.basicPower) {
				this.power = Math.max(this.power - 5, this.basicPower);
			} else {
				this.fire = false;
			}
		} else if (this.power > this.basicPower) {
			this.power -= 1;
		}

		let pos = this.pos();
		if (Math.abs(pos.x - this.target.x) < 1 && Math.abs(pos.y - this.target.y) < 1) {
			this.stopMovement();
		} else {
			if (this.target.mark) {
				let markPos = this.game.toScreenCoords(this.target.x, this.target.y);

				this.target.mark.x = markPos.x;
				this.target.mark.y = markPos.y;
			}
		}
	}

	draw(canvas) {
		if (this.target.mark) {
			this.game.canvas.drawCircle(this.target.mark.x, this.target.mark.y, this.target.mark.radius, this.target.mark.color);
		}

		super.draw(canvas);
	}
}

export default GPlayer;
