import GObject from 'common/object';
import Notify from './notify';

class GElement extends GObject {
	constructor(game, options) {
		super(game, options);

		this.initParams();
	}

	initParams() {
		this.hits = this.options.hits;

		this.color = this.options.color;

		this.radius = this.options.radius;

		this._speed = 6.25;

		this._position = {
			x: this.options.startX || 0,
			y: this.options.startY || 0
		};
	}

	pos() {
		return {
			x: this._position.x,
			y: this._position.y
		};
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

export default GElement;
