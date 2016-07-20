import GObject from 'common/object.js';

class GElement extends GObject {
	constructor(game, options) {
		super(game, options);

		this.initParams();
		this.el = this.createEl();
	}

	createEl() {
		return new fabric.Circle({
			radius: this.radius,
			fill: this.color,
			left: this._position.x,
			top: this._position.y
		});
	}

	initParams() {
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

	// x & y – in-game coordinates, not canvas
	draw() {
		let gamePos = this.pos();
		let screenPos = this.game.toScreenCoords(gamePos.x, gamePos.y);

		this.el.set('left', screenPos.x);
		this.el.set('top', screenPos.y);

		this.el.setCoords();
	}

	tick() {
		this.draw();
	}
}

export default GElement;
