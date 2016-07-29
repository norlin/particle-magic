import Log from 'common/log';
import GElement from './element';

class Target extends GElement {
	constructor(player, options) {
		super(player.game, options);

		this.color = this.options.color;
		this.player = player;
		this.maxRadius = 30;

		this.reset();
	}

	reset() {
		this.radius = this.maxRadius;
		this.direction = -1;
	}

	tick() {
		this.radius += this.direction * 1;

		if (this.radius <= 1) {
			this.radius = this.maxRadius;
		}
	}

	draw(canvas) {
		let pos = this.pos();

		let screenPos = this.game.toScreenCoords(pos.x, pos.y);

		this.game.canvas.strokeCircle(screenPos.x, screenPos.y, this.radius, this.color, 1);
	}
}

export default Target;
