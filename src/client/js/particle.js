import Utils from 'common/utils';
import {ParticlesCloud} from 'common/magic/particle';
import Dot from './dot';

class ClientParticlesCloud extends ParticlesCloud {
	constructor(parent, options) {
		super(parent, options);

		this.dots = [];
		this.fullDots = [];
	}

	getCloudSector() {
		return {
			x: this._position.x,
			y: this._position.y,
			radius: this.radius,
			radiusMin: this.radiusMin
		};
	}

	tick() {
		let fullCount = this.dots.length / this.game.field.visibility;
		let needAdd = fullCount - this.fullDots.length;
		if (needAdd > 0) {
			for (let i=0; i < needAdd; i += 1) {
				this.fullDots.push(new Dot(this.game, {
					radius: 1,
					color: '#f60',
					sector: this.getCloudSector()
				}));
			}
		} else {
			this.fullDots.length = fullCount;
		}

		this.dots.forEach(this.tickDot, this);
		this.fullDots.forEach(this.tickDot, this);
	}

	tickDot(dot) {
		if (dot.target && !this.target) {
			dot.tick();
		} else {
			let pos = dot.getPositionBySector(this.getCloudSector());
			dot._position = pos;
		}
	}

	draw(canvas) {
		/*let screenPos = this.game.toScreenCoords(this.pos());
		canvas.strokeCircle(screenPos, this.radius, this.color, 1);
		if (this.radiusMin) {
			canvas.strokeCircle(screenPos, this.radiusMin, this.color, 1);
		}*/

		this.dots.forEach((dot)=>dot.draw(canvas));
		this.fullDots.forEach((dot)=>dot.draw(canvas));
	}
}

export {ClientParticlesCloud};
