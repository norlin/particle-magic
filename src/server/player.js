import Log from 'common/log';
import Vector from 'common/vector';
import Element from 'common/element';
import {Skill} from 'common/magic/skill';

let log = new Log('Player');

class Player extends Element {
	constructor(game, socket, options) {
		super(game, options);

		this.type = 'player';

		this.socket = socket;
		this.screen = this.options.screen;

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

			this.target = new Vector(point.x, point.y);
		});

		socket.on('launchFire', (data)=>{
			this.launchFire(data);
		});

		socket.on('purgeEnergy', (data)=>{
			this.purgeEnergy();
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

		this.target = this.pos();
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

		let pos = this.pos();
		let fireballPos = pos.copy().move(data.direction, 50);

		let fireball = new Skill(this, {
			start: fireballPos,
			queue: [
				{
					class: 'Collector',
					options: {
						identifier: 'fire1',
						start: fireballPos,
						duration: 10
					}
				},
				{
					class: 'Attractor',
					//identifier: 'fire1',
					options: {
						target: 'fire1',
						start: pos
					}
				}
			]
		});

		fireball.once('end', ()=>{
			this.casting = false;
		});

		this.casting = true;
		fireball.start();
	}

	purgeEnergy() {
		this.game.field.feed(this.pos(), this.energy);
		this.energy = 0;
		this.maxEnergy = 0;
	}

	tick() {
		this.hits = 0;
		if (!this.casting) {
			this.move();
		}

		let compare = this.pos().sub(this.target);
		if (Math.abs(compare.x) < 1 && Math.abs(compare.y) < 1) {
			this.stopMovement();
		}

		if (this.energy < this.maxEnergy) {
			let drained = this.game.field.consume(this.pos(), Math.sqrt(this.power), this.power, false, this.id);
			this.energy = Math.min(this.maxEnergy, this.energy + drained);
		}
	}

	receiveDamage(amount) {
		log.debug('receiveDamage', amount);
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
		data.flows = this.game.field.flows;
		data.activeSector = this.game.field.getByCoordinates(this.pos());
		data.nearbies = this.game.field.getNearbiesTo(data.activeSector);

		this.socket.emit('update', data);
	}

	viewport() {
		let pos = this.pos();

		let half = this.screen.copy().divBy(2);

		let offset = 50;

		return {
			left: pos.x - half.x - offset,
			right: pos.x + half.x + offset,
			top: pos.y - half.y - offset,
			bottom: pos.y + half.y + offset
		};
	}
}

export default Player;
