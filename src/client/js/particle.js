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
		//let count = this.count;

		/*this.dots = [];

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
		}*/
	}

	tick() {
		//this.count = this.dots.length;
		this.dots.forEach((dot)=>{
			if (dot.target) {
				dot.tick();
			} else if (this.target) {
				let pos = dot.getPositionBySector({
					x: this._position.x,
					y: this._position.y,
					radius: this.radius
				});
				dot._position = pos;
				//dot.target = this.target.copy();
				/*dot.speed = this.speed;
				dot.setPosition({
					x: this.target.x,
					y: this.target.y,
					radius: this.radius
				});*/
			}
		});
	}

	draw(canvas) {
		//let screenPos = this.game.toScreenCoords(this.pos());
		//canvas.strokeCircle(screenPos, this.radius, this.color, 1);

		this.dots.forEach((dot)=>dot.draw(canvas));
	}
}

export {ClientParticlesCloud};
