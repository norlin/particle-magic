import Log from '../common/log';
import GElement from './element.js';

let log = new Log('Player');

class GPlayer extends GElement {
	constructor(game, socket, options) {
		super(game, options);

		this.socket = socket;
		this.screen = {
			width: this.options.screenWidth,
			height: this.options.screenHeight
		};

		socket.on('setTarget', (point)=>{
			this.target = {
				x: point.x,
				y: point.y
			};
		});

		socket.emit('createPlayer', {
			id: this.id,
			color: this.color,
			startX: this._position.x,
			startY: this._position.y,
			radius: this.radius
		});
	}

	initParams() {
		super.initParams();

		this.target = {
			x: this._position.x,
			y: this._position.y
		};
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

		this.target.x = this._position.x;
		this.target.y = this._position.y;
	}

	tick() {
		this.move();

		let pos = this.pos();
		if (Math.abs(pos.x - this.target.x) < 1 && Math.abs(pos.y - this.target.y) < 1) {
			this.stopMovement();
		}
	}

	updateClient() {
		let pos = this.pos();
		let screen = {
			width: this.screen.width,
			height: this.screen.height
		};

		let objects = this.game.getVisibleObjects(this.id, pos, screen);

		this.socket.emit('updatePosition', {
			x: pos.x,
			y: pos.y,
			targetX: this.target.x,
			targetY: this.target.y,
			visible: objects
		});
	}
}

export default GPlayer;
