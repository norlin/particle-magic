import Utils from 'common/utils';
import {ParticlesCloud} from 'common/magic/particle';
import Dot from './dot';

class ClientParticlesCloud extends ParticlesCloud {
	constructor(parent, options) {
		super(parent, options);

		this.dots = [];
	}

	tick() {
		this.dots.forEach((dot)=>{
			if (dot.target && !this.target) {
				dot.tick();
			} else if (this.target) {
				let pos = dot.getPositionBySector({
					x: this._position.x,
					y: this._position.y,
					radius: this.radius
				});
				dot._position = pos;
			}
		});
	}

	draw(canvas) {
		let screenPos = this.game.toScreenCoords(this.pos());
		canvas.strokeCircle(screenPos, this.radius, this.color, 1);

		this.dots.forEach((dot)=>dot.draw(canvas));
	}
}

export {ClientParticlesCloud};
