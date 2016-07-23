import Log from 'common/log';
import GElement from './element.js';
import {ParticlesCloud} from 'common/magic/particle.js';

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
		let socket = this.socket;

		socket.on('setTarget', (point)=>{
			if (this.aim) {
				return;
			}

			this.target = {
				x: point.x,
				y: point.y
			};
		});

		socket.on('launchFire', (data)=>{
			this.launchFire(data);
		});

		socket.on('aimStart', ()=>{
			this.aim = true;
			this.stopMovement();
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

	launchFire(data) {
		if (!this.aim) {
			return false;
		}

		this.aim = false;
		if (this.energy < this.fireCost) {
			this.socket.emit('noEnergy');
			return;
		}

		let cloud = new ParticlesCloud(this, {
			particle: 'fire',
			count: this.fireCost,
			radius: data.radius
		});

		cloud.setTarget(data.direction);
		this.game.add(cloud);

		this.energy -= this.fireCost;
		this.socket.emit('fire', {
			energy: this.energy,
			fireCost: this.fireCost,
			damage: cloud.power()
		});
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
