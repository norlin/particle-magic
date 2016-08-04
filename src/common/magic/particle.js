import Log from 'common/log';
import Utils from 'common/utils';
import Element from 'common/element.js';

let log = new Log('Particle');

const types = {
	fire: {
		color: '#f60'
	},
	air: {
		color: '#90C3D4'
	},
	water: {
		color: '#246AE3'
	},
	earth: {
		color: '#785924'
	}
};

class Particle {
	constructor(options) {
		this.type = options.type;

		this.damage = 1;
		this.color = types[this.type].color;
	}
}

class ParticlesCloud extends Element {
	constructor(parent, options) {
		let particle = new Particle({type: options.particle});
		options.color = particle.color;
		options.speed = 15;

		super(parent.game, options);
		options = this.options;

		this.parent = parent;

		this.particle = particle;
		this.radius = options.radius;
		this.count = options.count;
	}

	density() {
		return 1 / Math.sqrt(this.volume() / this.count);
	}

	volume() {
		return Math.PI * Math.pow(this.radius, 2);
	}

	power() {
		return this.particle.damage * this.count * this.density();
	}

	setTarget(direction) {
		let pos = this.parent.pos();

		let x = pos.x;
		let y = pos.y;

		let distance = Number.MAX_VALUE;
		let x2 = x + Math.sin(direction) * distance;
		let y2 = y + Math.cos(direction) * distance;

		this._position.x = x;
		this._position.y = y;

		this.target = {
			x: x2,
			y: y2
		};
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
	}

	draw() {
		if (!this.game.canvas) {
			return;
		}

		super.draw(this.game.canvas);
	}

	collision(object){
		switch (this.particle.type) {
		case 'fire':
			let power = this.power();
			if (object.receiveDamage) {
				object.receiveDamage(power);
			}
			break;
		}

		this.blast();
	}

	feed(amount) {
		this.count += amount;
		this.radius += amount;
	}
}

export {Particle, ParticlesCloud};
