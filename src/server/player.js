import Log from 'common/log';
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

		this.listen();

		let data = this.dataToSend({
			id: this.id,
			color: this.color,
			radius: this.radius,
			basicPower: this.basicPower,
		});

		socket.emit('createPlayer', data);
	}

	listen() {
		this.socket.on('setTarget', (point)=>{
			this.target = {
				x: point.x,
				y: point.y
			};
		});

		this.socket.on('launchFire', (data)=>{
			this.launchFire(data);
		});
	}

	dataToSend(additional) {
		return Object.assign({
			x: this._position.x,
			y: this._position.y,
			targetX: this.target.x,
			targetY: this.target.y,
			fireCost: this.fireCost,
			firePower: this.firePower,
			fireDistance: this.fireDistance,
			maxHealth: this.maxHealth,
			health: this.health,
			maxEnergy: this.maxEnergy,
			energy: this.energy,
			maxPower: this.maxPower,
			power: this.power,
		}, additional);
	}

	initParams() {
		super.initParams();

		let fields = [
			'fireCost',
			'firePower',
			'fireDistance',
			'maxHealth',
			'health',
			'maxEnergy',
			'energy',
			'maxPower',
			'power',
			'basicPower',
		];

		fields.forEach((field)=>{
			this[field] = this.options[field];
		});

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

	launchFire(data) {
		if (this.energy < this.fireCost) {
			this.socket.emit('noEnergy');
			return;
		}

		//this.fireDirection = data.direction;
		//this.fire = true;
		this.energy -= this.fireCost;
		this.socket.emit('fire', {
			energy: this.energy,
			fireCost: this.fireCost
		});
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

		if (this.energy < this.maxEnergy) {
			let drained = this.game.field.consume(pos.x, pos.y, Math.sqrt(this.power), this.power);
			this.energy = Math.min(this.maxEnergy, this.energy + drained);
		}
	}

	updateClient() {
		let pos = this.pos();

		let halfWidth = this.screen.width / 2;
		let halfHeight = this.screen.height / 2;

		let offset = 50;

		let area = {
			left: pos.x - halfWidth - offset,
			right: pos.x + halfWidth + offset,
			top: pos.y - halfHeight - offset,
			bottom: pos.y + halfHeight + offset
		};

		let data = this.dataToSend();
		data.visible = this.game.getVisibleObjects(this.id, area);
		data.sectors = this.game.field.getVisibleSectors(area);

		this.socket.emit('update', data);
	}
}

export default GPlayer;
