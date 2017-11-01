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
		this.radiusMin = options.radiusMin;
		this.count = options.count;

		this.lifetime = this.options.lifetime || 50;
		this.timer = 0;
	}

	power() {
		return this.particle.power * this.count;
	}

	setTarget(direction) {
		let pos = this.parent.pos();

		this._position = pos.copy();
		let distance = Number.MAX_VALUE;

		this.target = pos.move(direction, distance);
	}

	blast() {
		this.emit('blast');
		this._needRemove = true;
	}

	tick() {
		if (this.target) {
			this.move();
		}

		if (this.feedTimeout) {
			this.feedTimeout -= 1;
			if (this.feedTimeout === 0) {
				this.emit('collected');
			}
			return;
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

	feed(amount, timout) {
		this.count += amount;

		this.timer = 0;
		this.feedTimeout = timout+1;
	}

	getData() {
		return {
			radius: this.radius,
			radiusMin: this.radiusMin,
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
