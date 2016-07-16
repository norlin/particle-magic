import 'fabric'
import Log from './log'
import GElement from './element'
import Keys from './keys'
import Utils from './utils'

class GPlayer extends GElement {
	constructor(game, options) {
		super(game, options);

		let log = new Log('Player');
		this.log = log.log.bind(log);

		this.addListeners();
	}

	initParams() {
		super.initParams();

		this._position.x = this.game.options.screenWidth / 2;
		this._position.y = this.game.options.screenHeight / 2;

		this.radius = 20;
		this.mass = 100;

		this.target = {
			x: this._position.x,
			y: this._position.y
		};
	}

	createEl() {
		return new fabric.Circle({
			radius: this.radius,
			fill: this.options.color,
			left: 0,
			top: 0
		});
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

			this.target.mark = new fabric.Circle({
				radius: 2,
				fill: this.options.color,
				left: this.target.x,
				top: this.target.y
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

		if (this.target.mark) {
			this.target.mark.set('left', this.target.x - this._position.x + this.radius + (this.game.options.screenWidth / 2));
			this.target.mark.set('top', this.target.y - this._position.y + this.radius + (this.game.options.screenHeight / 2));
			this.target.mark.setCoords();
		}
	}

	stopMovement() {
		if (this.target.x == this._position.x && this.target.y == this._position.y) {
			return;
		}

		this.log('stopMovement');

		this.target.x = this._position.x;
		this.target.y = this._position.y;

		if (this.target.mark) {
			this.target.mark.remove();
		}
	}

	tick() {
		this.move();

		let pos = this.pos();
		if (Math.abs(pos.x - this.target.x) < 1 && Math.abs(pos.y - this.target.y) < 1) {
			this.stopMovement();
		}

		let screenWidth = this.game.options.screenWidth / 2;
		let screenHeight = this.game.options.screenHeight / 2;
		let gameWidth = this.game.options.width;
		let gameHeight = this.game.options.height;

		var x = 0;
		var y = 0;

		let player = this.pos();
		let userCurrent = this.pos();
		let cellCurrent = this.pos();

		let points = 30 + ~~(this.mass/5);
		let increase = Math.PI * 2 / points;

		var start = {
			x: player.x - (screenWidth),
			y: player.y - (screenHeight)
		};

		var circle = {
			x: cellCurrent.x - start.x,
			y: cellCurrent.y - start.y
		};

		this.draw(circle.x, circle.y);
	}
}

export default GPlayer;
