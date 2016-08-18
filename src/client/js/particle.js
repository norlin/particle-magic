import Utils from 'common/utils';
import {ParticlesCloud} from 'common/magic/particle';
import Dot from './dot';

class ClientParticlesCloud extends ParticlesCloud {
	constructor(parent, options) {
		super(parent, options);

		this.dots = [];

		this.update();
	}

	update() {
		let count = this.count * 10;

		this.dots = [];

		for (let i=0; i < count; i += 1) {
			this.dots.push(new Dot(this.game, {
				radius: 1,
				color: this.particle.getColor(),
				sector: {
					x: this._position.x,
					y: this._position.y,
					radius: this.radius
				}
			}));
		}
	}

	tick() {

	}

	draw(canvas) {
		this.dots.forEach((dot)=>dot.draw(canvas));
	}
}

export {ClientParticlesCloud};
