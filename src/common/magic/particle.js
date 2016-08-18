import Log from 'common/log';
import Utils from 'common/utils';
import Element from 'common/element.js';

let log = new Log('Particle');

const types = {
	fire: {
		color: '#f60',
		power: 5
	},
	air: {
		color: '#90C3D4'
	},
	water: {
		color: '#246AE3',
		power: 5
	},
	earth: {
		color: '#785924'
	}
};

class Particle {
	constructor(options) {
		this.type = options.type;

		this.power = types[this.type].power;
		this.color = types[this.type].color;
	}

	getColor() {
		// TODO: randomize
		return this.color;
	}
}

class ParticlesCloud extends Element {
	constructor(parent, options) {
		let particle = new Particle({type: options.particle});
		options.color = particle.color;
		options.speed = 15;

		super(parent.game, options);
		options = this.options;

		this.type = 'cloud';

		this.parent = parent;

		this.particle = particle;
		this.radius = options.radius;
		this.count = options.count;

		this.lifetime = 50;
		this.timer = 0;
	}

	density() {
		return 1 / Math.sqrt(this.volume() / this.count);
	}

	volume() {
		return Math.PI * Math.pow(this.radius, 2);
	}

	power() {
		return this.particle.power * this.count;// * this.density();
	}

	setTarget(direction) {
		let pos = this.parent.pos();

		this._position = pos.copy();
		let distance = Number.MAX_VALUE;

		this.target = pos.move(direction, distance);
	}

	blast() {
		//this.game.remove(this.id);
		this.emit('blast');
		this._needRemove = true;
	}

	tick() {
		if (this.target) {
			this.move();
		}

		this.timer += 1;
		if (this.timer > this.lifetime) {
			this.blast();
		}
	}

	collision(object){
		let power;
		switch (this.particle.type) {
		case 'fire':
			power = this.power();
			if (object.receiveDamage) {
				object.receiveDamage(power);
			}
			break;
		case 'water':
			power = -this.power();
			if (object.receiveDamage) {
				object.receiveDamage(power);
			}
			break;
		}

		this.blast();
	}

	feed(amount) {
		this.count += amount;

		this.timer = 0;
	}

	getData() {
		return {
			radius: this.radius,
			particle: this.options.particle,
			count: this.count,
			target: this.target ? {
				x: this.target.x,
				y: this.target.y
			} : undefined
		};
	}
}

export {Particle, ParticlesCloud};
