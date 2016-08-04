import Log from 'common/log';
import Element from 'common/element.js';
import Skill from 'common/magic/skill';

let log = new Log('Player');

class Player extends Element {
	constructor(game, socket, options) {
		super(game, options);

		this.type = 'player';

		this.socket = socket;
		this.screen = {
			width: this.options.screenWidth,
			height: this.options.screenHeight
		};

		this.listen();

		this.hits = 0;

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
			power: this.power
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

	drain(amount) {
		if (this.energy < amount) {
			return false;
		}

		this.energy -= amount;
		return true;
	}

	launchFire(data) {
		if (!this.aim) {
			return false;
		}

		this.aim = false;
		//if (this.energy < this.fireCost) {
		//	this.socket.emit('noEnergy');
		//	return;
		//}

		/*let cloud = new ParticlesCloud(this, {
			particle: 'fire',
			count: this.fireCost,
			radius: data.radius
		});

		cloud.setTarget(data.direction);
		this.game.add(cloud);

		if (this.drain(this.fireCost)) {
			this.socket.emit('fire', {
				energy: this.energy,
				fireCost: this.fireCost,
				damage: cloud.power()
			});
		}*/

		let pos = this.pos();
		let x = pos.x + Math.sin(data.direction) * 50;
		let y = pos.y + Math.cos(data.direction) * 50;

		let fireball = new Skill(this, {
			startX: x,
			startY: y,
			queue: [
				{
					class: 'Collector',
					options: {
						startX: x,
						startY: y,
						duration: 20
					}
				}
			]
		});

		log.debug('listen for end');
		fireball.once('end', ()=>{
			log.debug('on fireball end');
			this.casting = false;
		});

		this.casting = true;
		fireball.start();
	}

	tick() {
		this.hits = 0;
		if (!this.casting) {
			this.move();
		}

		let pos = this.pos();
		if (Math.abs(pos.x - this.target.x) < 1 && Math.abs(pos.y - this.target.y) < 1) {
			this.stopMovement();
		}

		if (this.energy < this.maxEnergy) {
			let drained = this.game.field.consume(pos.x, pos.y, Math.sqrt(this.power), this.power);
			this.energy = Math.min(this.maxEnergy, this.energy + drained);
		}
	}

	receiveDamage(amount) {
		this.health -= amount;

		if (this.health <= 0) {
			this._needRemove = true;
		}

		this.hits += amount;
	}

	collision(object) {

	}

	die() {
		this.stopMovement();
		this.socket.emit('died');
	}

	updateClient() {
		let data = this.dataToSend();
		data.hits = this.hits;

		let area = this.viewport();
		data.visible = this.game.getVisibleObjects(this.id, area);
		data.sectors = this.game.field.getVisibleSectors(area);

		this.socket.emit('update', data);
	}

	viewport() {
		let pos = this.pos();

		let halfWidth = this.screen.width / 2;
		let halfHeight = this.screen.height / 2;

		let offset = 50;

		return {
			left: pos.x - halfWidth - offset,
			right: pos.x + halfWidth + offset,
			top: pos.y - halfHeight - offset,
			bottom: pos.y + halfHeight + offset
		};
	}
}

export default Player;
