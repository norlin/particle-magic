import Log from 'common/log';
import Utils from 'common/utils';
import GElement from 'server/element.js';

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

class ParticlesCloud extends GElement {
	constructor(player, options) {
		let particle = new Particle({type: options.particle});
		options.color = particle.color;
		options.speed = 15;

		super(player.game, options);
		options = this.options;

		this.player = player;

		this.particle = particle;
		this.radius = options.radius;
		this.count = options.count;
	}

	distance() {
		return Math.sqrt(this.volume() / this.count);
	}

	volume() {
		return Math.PI * Math.pow(this.radius, 2);
	}

	power() {
		return (this.particle.damage * this.count) / this.distance();
	}

	setTarget(direction) {
		let pos = this.player.pos();
		let distance = this.player.radius + 50;

		let x = pos.x + Math.sin(direction) * distance;
		let y = pos.y + Math.cos(direction) * distance;

		let x2 = x + Math.sin(direction) * 1000;
		let y2 = y + Math.cos(direction) * 1000;

		this._position.x = x;
		this._position.y = y;

		this.target = {
			x: x2,
			y: y2
		};
	}

	stopMovement() {
		if (this.target.x == this._position.x && this.target.y == this._position.y) {
			this.blast();
			return;
		}

		this.target.x = this._position.x;
		this.target.y = this._position.y;

		this.blast();
	}

	blast() {
		this.game.remove(this.id);
	}

	tick() {
		this.move();

		let pos = this.pos();

		if (Math.abs(pos.x - this.target.x) < 1 && Math.abs(pos.y - this.target.y) < 1) {
			this.stopMovement();
		}
	}

	draw() {
		if (!this.game.canvas) {
			return;
		}

		super.draw(this.game.canvas);
	}
}

export {Particle, ParticlesCloud};
