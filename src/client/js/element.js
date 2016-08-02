import Element from 'common/element';
import Notify from './notify';

class ClientElement extends Element {
	constructor(game, options) {
		super(game, options);

		this.initParams();
	}

	initParams() {
		super.initParams();

		this.hits = this.options.hits;
	}

	draw(canvas) {
		let gamePos = this.pos();
		let screenPos = this.game.toScreenCoords(gamePos.x, gamePos.y);

		canvas.drawCircle(screenPos.x, screenPos.y, this.radius, this.color);

		if (this.hits) {
			new Notify(this.game, {
				x: screenPos.x,
				y: screenPos.y,
				text: `-${Math.round(this.hits)}`,
				timeout: 1000
			});

			this.hits = undefined;
		}
	}

	tick() {}
}

export default ClientElement;
